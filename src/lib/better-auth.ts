import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { MenuLayout, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { buildStableMenuUrl, generateQrSvg } from "@/lib/qr";

export interface ProvisionHotelInput {
  hotelName?: string;
  email: string;
  currency?: string;
  currencySymbol?: string;
  city?: string | null;
  country?: string | null;
}

/**
 * Creates a new Hotel workspace along with a default published menu, QR code,
 * starter category, and signature item. Used by both Better Auth (Google OAuth /
 * email sign-up) and the direct registration endpoint.
 */
export async function provisionHotelWorkspace(input: ProvisionHotelInput) {
  const emailLower = input.email.toLowerCase().trim();
  const fallbackName =
    input.hotelName?.trim() ||
    `${emailLower.split("@")[0].replace(/[._-]+/g, " ")} Hospitality`;

  const baseSlug = slugify(fallbackName) || `hotel-${Date.now()}`;
  let finalSlug = baseSlug;
  let count = 1;
  while (await db.hotel.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${count++}`;
  }

  const currency = input.currency || "ETB";
  const currencySymbol = input.currencySymbol || (currency === "ETB" ? "Br " : "$");

  const hotel = await db.hotel.create({
    data: {
      name: fallbackName,
      slug: finalSlug,
      email: emailLower,
      currency,
      currencySymbol,
      city: input.city || null,
      country: input.country || null,
      starRating: 5,
      primaryColor: "#B89334",
      accentColor: "#131418",
      fontFamily: "serif",
    },
  });

  const menuSlug = `${finalSlug}-dining`;
  const menuId = randomUUID();
  const publicUrl = buildStableMenuUrl(menuId);
  const qrSvg = await generateQrSvg(publicUrl);

  const starterMenu = await db.menu.create({
    data: {
      id: menuId,
      hotelId: hotel.id,
      title: "All-Day Dining & Bar",
      slug: menuSlug,
      description:
        "Our signature culinary selection prepared daily with artisanal ingredients.",
      isPublished: true,
      publishedAt: new Date(),
      displayLayout: MenuLayout.GRID,
      qrCodeSvg: qrSvg,
    },
  });

  const starterCategory = await db.menuCategory.create({
    data: {
      menuId: starterMenu.id,
      name: "Chef's Signatures",
      description: "Handcrafted selections recommended by our culinary team",
      orderIndex: 1,
    },
  });

  await db.menuItem.create({
    data: {
      categoryId: starterCategory.id,
      name: "Prime Artisan Entrée",
      description: "Tender cut served with seasonal vegetables and chef's reduction.",
      price: 48.0,
      isAvailable: true,
      isChefSpecial: true,
      isFeatured: true,
      orderIndex: 1,
      dietaryTags: ["GLUTEN_FREE"],
    },
  });

  return { hotel, starterMenu };
}

/**
 * Ensures that an existing User row with a legacy `passwordHash` also has a
 * corresponding Better Auth `Account` (`providerId: "credential"`) record.
 */
export async function syncCredentialAccountForUser(user: {
  id: string;
  passwordHash: string;
}) {
  if (!user.passwordHash) return;
  const existingAccount = await db.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });
  if (!existingAccount) {
    await db.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: user.passwordHash,
      },
    });
  } else if (!existingAccount.password) {
    await db.account.update({
      where: { id: existingAccount.id },
      data: { password: user.passwordHash },
    });
  }
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.JWT_SECRET ||
    "lux-hotel-default-better-auth-secret-32chars",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: isGoogleAuthConfigured(),
      prompt: "select_account",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  user: {
    additionalFields: {
      hotelId: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: Role.OWNER,
        input: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
        input: true,
      },
      passwordHash: {
        type: "string",
        required: false,
        defaultValue: "",
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email" && ctx.body && typeof ctx.body === "object") {
        const rawEmail = (ctx.body as { email?: string }).email;
        if (typeof rawEmail === "string" && rawEmail.trim()) {
          const email = rawEmail.toLowerCase().trim();
          const existingUser = await db.user.findUnique({
            where: { email },
            select: { id: true, passwordHash: true },
          });
          if (existingUser?.passwordHash) {
            await syncCredentialAccountForUser(existingUser);
          }
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const data = user as Record<string, unknown>;
          const email = String(data.email || "").toLowerCase().trim();
          const name = String(data.name || email.split("@")[0] || "Hotel Owner");
          let hotelId = typeof data.hotelId === "string" && data.hotelId ? data.hotelId : "";

          if (!hotelId) {
            const { hotel } = await provisionHotelWorkspace({
              hotelName: `${name}'s Workspace`,
              email,
            });
            hotelId = hotel.id;
          }

          return {
            data: {
              ...user,
              email,
              name,
              hotelId,
              role: (data.role as Role) || Role.OWNER,
              avatarUrl:
                (typeof data.avatarUrl === "string" && data.avatarUrl) ||
                (typeof data.image === "string" && data.image) ||
                null,
              passwordHash:
                typeof data.passwordHash === "string" ? data.passwordHash : "",
            },
          };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

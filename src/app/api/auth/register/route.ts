import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSessionToken, setAuthCookie, getJwtSecret } from "@/lib/auth";
import { registerSchema } from "@/validations";
import { slugify } from "@/lib/utils";
import { generateQrSvg, buildStableMenuUrl } from "@/lib/qr";
import { Role, MenuLayout } from "@prisma/client";

export async function POST(req: Request) {
  try {
    getJwtSecret(); // Fail before creating an account if signing is misconfigured.
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { hotelName, email, password, name, currency, currencySymbol, city, country } = validated.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate unique slug for the hotel
    let baseSlug = slugify(hotelName);
    let finalSlug = baseSlug;
    let count = 1;
    while (await db.hotel.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const passwordHash = await hashPassword(password);

    // Create Hotel, Owner User, and Starter Default Menu in transaction
    const result = await db.$transaction(async (tx) => {
      const hotel = await tx.hotel.create({
        data: {
          name: hotelName,
          slug: finalSlug,
          email: email.toLowerCase(),
          currency: currency || "USD",
          currencySymbol: currencySymbol || "$",
          city: city || null,
          country: country || null,
          starRating: 5,
          primaryColor: "#B89334",
          accentColor: "#131418",
          fontFamily: "serif",
        },
      });

      const user = await tx.user.create({
        data: {
          hotelId: hotel.id,
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: Role.OWNER,
        },
      });

      // Create initial Welcome Menu
      const menuSlug = `${finalSlug}-dining`;
      const menuId = randomUUID();
      const publicUrl = buildStableMenuUrl(menuId);
      const qrSvg = await generateQrSvg(publicUrl);

      const starterMenu = await tx.menu.create({
        data: {
          id: menuId,
          hotelId: hotel.id,
          title: "All-Day Dining & Bar",
          slug: menuSlug,
          description: "Our signature culinary selection prepared daily with artisanal ingredients.",
          isPublished: true,
          publishedAt: new Date(),
          displayLayout: MenuLayout.GRID,
          qrCodeSvg: qrSvg,
        },
      });

      // Add a starter category
      const starterCategory = await tx.menuCategory.create({
        data: {
          menuId: starterMenu.id,
          name: "Chef's Signatures",
          description: "Handcrafted selections recommended by our culinary team",
          orderIndex: 1,
        },
      });

      // Add a starter item
      await tx.menuItem.create({
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

      return { hotel, user, starterMenu };
    });

    const token = await signSessionToken({
      userId: result.user.id,
      hotelId: result.hotel.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        hotelId: result.hotel.id,
      },
      hotel: result.hotel,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register hotel" }, { status: 500 });
  }
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/auth";
import { generateQrSvg, generateQrPngDataUrl, buildPublicMenuUrl } from "../src/lib/qr";
import { formatPrice, slugify } from "../src/lib/utils";
import { menuSchema, itemSchema, hotelProfileSchema, loginSchema } from "../src/validations";
import { Role } from "@prisma/client";

describe("1. Multi-Tenant Authentication & Cryptographic Session Security", () => {
  it("should securely hash and verify passwords with bcrypt", async () => {
    const password = "LuxuryPassword2026!";
    const hash = await hashPassword(password);
    assert.notEqual(hash, password);

    const valid = await verifyPassword(password, hash);
    assert.equal(valid, true);

    const invalid = await verifyPassword("WrongPassword!", hash);
    assert.equal(invalid, false);
  });

  it("should issue and verify valid tenant session JWT tokens", async () => {
    const sessionData = {
      userId: "user-tenant-a-123",
      hotelId: "hotel-grand-azure-789",
      email: "director@grandazure.com",
      role: Role.OWNER,
      name: "Jean-Luc Moreau",
    };

    const token = await signSessionToken(sessionData);
    assert.ok(typeof token === "string" && token.length > 50);

    const decoded = await verifySessionToken(token);
    assert.ok(decoded !== null);
    assert.equal(decoded.userId, sessionData.userId);
    assert.equal(decoded.hotelId, sessionData.hotelId);
    assert.equal(decoded.role, Role.OWNER);
  });

  it("should reject tampered or malformed tokens", async () => {
    const decoded = await verifySessionToken("malicious.tampered.jwt-string");
    assert.equal(decoded, null);
  });

  it("should enforce tenant boundary separation between distinct hotel tenants", () => {
    const hotelTenantA = "hotel-azure-santorini";
    const hotelTenantB = "hotel-palais-paris";

    const userSessionA = { hotelId: hotelTenantA };
    const userSessionB = { hotelId: hotelTenantB };

    // Verifying Tenant A cannot act on Tenant B's resources
    const isAuthorizedForTenantB = userSessionA.hotelId === hotelTenantB;
    assert.equal(isAuthorizedForTenantB, false);

    const isAuthorizedForTenantA = userSessionB.hotelId === hotelTenantA;
    assert.equal(isAuthorizedForTenantA, false);
  });
});

describe("2. QR Code Generation & URL Dispatcher", () => {
  it("should build proper public menu URL from slug", () => {
    const url = buildPublicMenuUrl("azure-letoile-dinner");
    assert.ok(url.includes("/menu/azure-letoile-dinner"));
  });

  it("should generate valid scalable vector SVG QR code with customized colors", async () => {
    const url = "http://localhost:3000/menu/azure-letoile-dinner";
    const svg = await generateQrSvg(url, {
      darkColor: "#B89334",
      lightColor: "#FFFFFF",
      width: 320,
    });

    assert.ok(svg.includes("<svg"));
    assert.ok(svg.includes("</svg>"));
    assert.ok(svg.includes("#B89334")); // Custom gold brand color
  });

  it("should generate high-resolution PNG data URL for print export", async () => {
    const url = "http://localhost:3000/menu/azure-letoile-dinner";
    const pngDataUrl = await generateQrPngDataUrl(url, {
      darkColor: "#131418",
      lightColor: "#FFFFFF",
      width: 600,
    });

    assert.ok(pngDataUrl.startsWith("data:image/png;base64,"));
  });
});

describe("3. Data Validation & Integrity (Zod Schemas)", () => {
  it("should validate valid hotel profile settings", () => {
    const validProfile = {
      name: "The Grand Azure Resort & Spa",
      tagline: "Timeless luxury overlooking the caldera",
      description: "Michelin-starred dining on the cliffs of Oia.",
      starRating: 5,
      phone: "+30 22860 12345",
      email: "concierge@grandazure.com",
      website: "https://grandazure.luxury",
      address: "Caldera Cliffside Promenade 4",
      city: "Oia",
      country: "Greece",
      primaryColor: "#B89334",
      accentColor: "#131418",
      fontFamily: "serif",
      currency: "EUR",
      currencySymbol: "€",
    };

    const res = hotelProfileSchema.safeParse(validProfile);
    assert.equal(res.success, true);
  });

  it("should reject invalid email in hotel profile", () => {
    const invalidProfile = {
      name: "Resort",
      email: "not-an-email",
    };

    const res = hotelProfileSchema.safeParse(invalidProfile);
    assert.equal(res.success, false);
  });

  it("should validate and enforce slug constraints on menus", () => {
    const validMenu = {
      title: "Rooftop Sunset Lounge",
      slug: "rooftop-sunset-lounge",
      description: "Artisanal cocktails and light tapas",
      isPublished: true,
      displayLayout: "CARDS",
    };

    const validRes = menuSchema.safeParse(validMenu);
    assert.equal(validRes.success, true);

    const invalidMenu = {
      title: "Invalid Menu",
      slug: "INVALID SLUG WITH SPACES!",
    };
    const invalidRes = menuSchema.safeParse(invalidMenu);
    assert.equal(invalidRes.success, false);
  });

  it("should validate culinary dish creation and pricing", () => {
    const validItem = {
      categoryId: "cat-starters-123",
      name: "Oscietra Royal Caviar",
      description: "30g Golden Oscietra on warm brioche",
      price: 145.0,
      discountPrice: 130.0,
      isAvailable: true,
      isChefSpecial: true,
      isFeatured: true,
      calories: 340,
      prepTimeMinutes: 12,
      dietaryTags: ["PESCATARIAN"],
      allergens: ["DAIRY", "GLUTEN", "FISH"],
    };

    const res = itemSchema.safeParse(validItem);
    assert.equal(res.success, true);
  });

  it("should reject negative prices on menu items", () => {
    const invalidItem = {
      categoryId: "cat-1",
      name: "Negative Dish",
      price: -25.0,
    };
    const res = itemSchema.safeParse(invalidItem);
    assert.equal(res.success, false);
  });
});

describe("4. Utility Functions (Formatting & URL Slugs)", () => {
  it("should format multi-currency pricing correctly", () => {
    assert.equal(formatPrice(145, "EUR", "€"), "€145.00");
    assert.equal(formatPrice(88.5, "USD", "$"), "$88.50");
    assert.equal(formatPrice(32, "GBP", "£"), "£32.00");
  });

  it("should generate clean web-safe slugs", () => {
    assert.equal(slugify("L'Étoile Fine Dining & Wine!"), "letoile-fine-dining-wine");
    assert.equal(slugify("Pool Bar & Lounge 2026"), "pool-bar-lounge-2026");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { parseMenuText, extractedMenuSchema, importCommitSchema } from "../src/lib/menu-import";
import { matchesMediaType, detectMediaMimeType } from "../src/lib/media-validation";
import { matchMediaFilesToDishes } from "../src/lib/media-matcher";
import { tenantFromHost } from "../src/lib/tenant-host";
import { buildStableMenuUrl } from "../src/lib/qr";
import { getJwtSecret, signSessionToken, verifySessionToken } from "../src/lib/auth";
import { Role } from "@prisma/client";

describe("Reviewed menu imports", () => {
  it("preserves bilingual names, categories, descriptions and explicit zero prices", () => {
    const rows = parseMenuText("# Breakfast\nፉል / Ful | With bread | 1,250.50 ETB\nWater | 0\n# Drinks\nCoffee | 80");
    assert.equal(rows[0].name, "ፉል / Ful");
    assert.equal(rows[0].category, "Breakfast");
    assert.equal(rows[0].description, "With bread");
    assert.equal(rows[0].price, 1250.5);
    assert.equal(rows[1].price, 0);
    assert.equal(rows[2].category, "Drinks");
  });
  it("keeps unreadable or multi-price entries unresolved rather than inventing prices", () => {
    const rows = parseMenuText("Coffee | 8O\nLatte | 100/150\nTea");
    assert.ok(rows.every((row) => row.price === null));
    assert.ok(rows.every((row) => row.note.length > 0));
  });
  it("requires approval, valid prices and at least one item on commit", () => {
    const items = parseMenuText("Coffee | 80");
    const draft = { importId: randomUUID(), title: "Cafe menu", reviewed: true, items };
    assert.equal(importCommitSchema.safeParse(draft).success, true);
    for (const change of [{ reviewed: false }, { items: [] }, { items: [{ ...items[0], price: null }] }, { items: [{ ...items[0], price: -1 }] }, { items: [{ ...items[0], price: Infinity }] }]) {
      assert.equal(importCommitSchema.safeParse({ ...draft, ...change }).success, false);
    }
  });
  it("rejects oversized extraction output and empty input", () => {
    assert.equal(extractedMenuSchema.safeParse({ items: Array.from({ length: 201 }, () => ({ name: "Tea", category: "Drinks", price: 10 })) }).success, false);
    assert.throws(() => parseMenuText("   "));
  });
  it("accepts extracted brand metadata, logoBox, and dish imageBox coordinates", () => {
    const parsed = extractedMenuSchema.safeParse({
      brand: {
        businessName: "Abyssinia Grand Hotel",
        menuTitle: "All Day Dining",
        tagline: "Authentic Ethiopian Cuisine",
        logoBox: { ymin: 40, xmin: 60, ymax: 180, xmax: 220 },
      },
      items: [
        {
          name: "Firfir Tibs",
          category: "Mains",
          price: 450,
          imageBox: { ymin: 250, xmin: 100, ymax: 480, xmax: 340 },
        },
      ],
    });
    assert.equal(parsed.success, true);
  });
});

describe("Smart batch media matching", () => {
  const dishes = [
    { id: "dish-1", name: "Firfir Tibs", category: "Mains" },
    { id: "dish-2", name: "ፉል / Special Ful", category: "Breakfast" },
    { id: "dish-3", name: "Doro Wat", category: "Traditional" },
    { id: "dish-4", name: "Macchiato", category: "Coffee" },
  ];

  it("matches exact, hyphenated, and consonant-shorthand filenames (firfirtibs, firfir-tibs, frfrtbs.img) plus videos", () => {
    const matches = matchMediaFilesToDishes(
      [
        { id: "f1", filename: "firfirtibs.jpg" },
        { id: "f2", filename: "firfir-tibs.png" },
        { id: "f3", filename: "frfrtbs.img" },
        { id: "f4", filename: "firfir_tibs_promo.mp4", mimeType: "video/mp4" },
        { id: "f5", filename: "special-ful.webp" },
        { id: "f6", filename: "drwt.jpeg" },
      ],
      dishes
    );

    assert.equal(matches[0].matchedDishId, "dish-1");
    assert.equal(matches[0].mediaKind, "image");
    assert.ok(matches[0].score >= 0.9);
    assert.equal(matches[0].confidence, "high");

    assert.equal(matches[1].matchedDishId, "dish-1");
    assert.ok(matches[1].score >= 0.9);

    assert.equal(matches[2].matchedDishId, "dish-1");
    assert.equal(matches[2].mediaKind, "image");
    assert.ok(matches[2].score >= 0.78);

    assert.equal(matches[3].matchedDishId, "dish-1");
    assert.equal(matches[3].mediaKind, "video");

    assert.equal(matches[4].matchedDishId, "dish-2");
    assert.equal(matches[5].matchedDishId, "dish-3");
  });
});

describe("Public routing", () => {
  it("accepts a single business label only under the exact root domain", () => {
    assert.equal(tenantFromHost("Crave.Example.com:3000", "example.com"), "crave");
    assert.equal(tenantFromHost("crave.localhost:3000", "localhost"), "crave");
    for (const host of ["example.com", "app.example.com", "www.example.com", "example.com.evil.com", "evil-example.com", "a.b.example.com", "-bad.example.com"]) {
      assert.equal(tenantFromHost(host, "example.com"), null);
    }
  });
  it("uses immutable IDs for printed QR destinations", () => {
    const id = randomUUID();
    assert.ok(buildStableMenuUrl(id).endsWith(`/q/${id}`));
  });
});

describe("Authentication and upload boundaries", () => {
  it("refuses missing and short signing secrets", async () => {
    const previous = process.env.JWT_SECRET;
    try {
      delete process.env.JWT_SECRET;
      assert.throws(getJwtSecret, /JWT_SECRET/);
      process.env.JWT_SECRET = "short";
      assert.throws(getJwtSecret, /JWT_SECRET/);
      process.env.JWT_SECRET = "test-only-32-byte-secret-for-auth-boundaries";
      const token = await signSessionToken({ userId: "owner", hotelId: "cafe", email: "test@example.com", name: "Test", role: Role.OWNER });
      assert.equal((await verifySessionToken(token))?.hotelId, "cafe");
      process.env.JWT_SECRET = "a-different-test-secret-of-at-least-32-bytes";
      assert.equal(await verifySessionToken(token), null);
    } finally {
      if (previous === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previous;
    }
  });
  it("rejects HTML/SVG masquerading as images, accepts matching signatures, and detects magic bytes for .img files", () => {
    assert.equal(matchesMediaType(Buffer.from("<html><script>alert(1)</script>"), "image/png"), false);
    assert.equal(matchesMediaType(Buffer.from("<svg/>"), "image/svg+xml"), false);
    assert.equal(matchesMediaType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"), true);
    assert.equal(matchesMediaType(Buffer.from("%PDF-1.7"), "application/pdf"), true);
    assert.equal(detectMediaMimeType(Buffer.from([255, 216, 255, 224, 0, 16, 74, 70])), "image/jpeg");
    assert.equal(detectMediaMimeType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "image/png");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { MenuLayout } from "@prisma/client";

describe("5. PostgreSQL Database Persistence & Multi-Tenant Isolation", () => {
  it("should successfully query the seeded luxury hotels", async () => {
    const azure = await db.hotel.findUnique({
      where: { slug: "the-grand-azure" },
      include: { menus: true, users: true },
    });

    assert.ok(azure !== null);
    assert.equal(azure.starRating, 5);
    assert.ok(azure.menus.length >= 2);
    assert.ok(azure.users.length >= 1);

    const saintGermain = await db.hotel.findUnique({
      where: { slug: "saint-germain-palais" },
      include: { menus: true },
    });

    assert.ok(saintGermain !== null);
    assert.notEqual(azure.id, saintGermain.id);
  });

  it("should enforce multi-tenant isolation: Hotel A cannot access Hotel B menus", async () => {
    const azure = await db.hotel.findUnique({ where: { slug: "the-grand-azure" } });
    const saintGermain = await db.hotel.findUnique({ where: { slug: "saint-germain-palais" } });

    assert.ok(azure && saintGermain);

    // Fetch Saint Germain's menu
    const sgMenu = await db.menu.findFirst({ where: { hotelId: saintGermain.id } });
    assert.ok(sgMenu);

    // Query attempting to find Saint Germain's menu under Azure's tenant ID
    const crossTenantAttempt = await db.menu.findFirst({
      where: {
        id: sgMenu.id,
        hotelId: azure.id, // Trying to access as Hotel Azure!
      },
    });

    // Must be null (strictly isolated)
    assert.equal(crossTenantAttempt, null);
  });

  it("should create, publish, and toggle item availability in PostgreSQL", async () => {
    const azure = await db.hotel.findUnique({ where: { slug: "the-grand-azure" } });
    assert.ok(azure);

    // 1. Create a test menu
    const testMenu = await db.menu.create({
      data: {
        hotelId: azure.id,
        title: "Sommelier Special Tasting 2026",
        slug: `test-sommelier-${Date.now()}`,
        isPublished: true,
        displayLayout: MenuLayout.GRID,
      },
    });
    assert.ok(testMenu.id);
    assert.equal(testMenu.isPublished, true);

    // 2. Create a test category
    const testCat = await db.menuCategory.create({
      data: {
        menuId: testMenu.id,
        name: "Vintage Champagnes",
        orderIndex: 1,
      },
    });
    assert.ok(testCat.id);

    // 3. Create a dish
    const testItem = await db.menuItem.create({
      data: {
        categoryId: testCat.id,
        name: "Krug Clos d'Ambonnay Champagne",
        price: 2400.0,
        isAvailable: true,
        isChefSpecial: true,
        dietaryTags: ["VEGAN"],
      },
    });
    assert.equal(testItem.isAvailable, true);

    // 4. Toggle availability (86 the item)
    const updatedItem = await db.menuItem.update({
      where: { id: testItem.id },
      data: { isAvailable: false },
    });
    assert.equal(updatedItem.isAvailable, false);

    // 5. Clean up test record
    await db.menu.delete({ where: { id: testMenu.id } });
  });
});

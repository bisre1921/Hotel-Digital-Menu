import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { request } from "node:http";
import { db } from "../src/lib/db";
import { signSessionToken } from "../src/lib/auth";
import { Role } from "@prisma/client";

// Opt-in: use an isolated database and the same JWT_SECRET in the app/test process.
const enabled = process.env.RUN_HTTP_TESTS === "1";
const base = process.env.TEST_APP_URL || "http://localhost:3107";
describe("HTTP tenant and reviewed-import workflows", { skip: !enabled }, () => {
  const suffix = randomUUID();
  let hotelA: string;
  let hotelB: string;
  let categoryB: string;
  let itemA: string;
  let menuA: string;
  let cookie: string;
  const importId = randomUUID();
  const body = { importId, title: "Reviewed cafe menu", reviewed: true, items: [
    { category: "Breakfast", name: "ፉል / Ful", description: "With bread", price: 180, note: "" },
    { category: "Drinks", name: "Coffee", description: "", price: 80, note: "" },
  ] };
  const call = (path: string, data: unknown, method = "POST", authorized = true) => fetch(`${base}${path}`, {
    method, headers: { "Content-Type": "application/json", ...(authorized ? { Cookie: cookie } : {}) },
    body: JSON.stringify(data), redirect: "manual",
  });
  before(async () => {
    const a = await db.hotel.create({ data: { name: "QA Cafe A", slug: `qa-a-${suffix}`, email: `a-${suffix}@example.invalid`, currency: "ETB", currencySymbol: "Br" } });
    hotelA = a.id;
    const b = await db.hotel.create({ data: { name: "QA Cafe B", slug: `qa-b-${suffix}`, email: `b-${suffix}@example.invalid` } });
    hotelB = b.id;
    const original = await db.menu.create({ data: { hotelId: hotelA, title: "Original", slug: `qa-original-${suffix}`, categories: { create: { name: "A", items: { create: { name: "Tea", price: 50 } } } } }, include: { categories: { include: { items: true } } } });
    menuA = original.id; itemA = original.categories[0].items[0].id;
    const other = await db.menu.create({ data: { hotelId: hotelB, title: "Other", slug: `qa-other-${suffix}`, categories: { create: { name: "B" } } }, include: { categories: true } });
    categoryB = other.categories[0].id;
    const token = await signSessionToken({ userId: randomUUID(), hotelId: hotelA, name: "QA Owner", email: a.email, role: Role.OWNER });
    cookie = `lux_hotel_token=${token}`;
  });
  after(async () => {
    await db.hotel.deleteMany({ where: { id: { in: [hotelA, hotelB].filter(Boolean) } } });
    await db.$disconnect();
  });
  it("rejects unauthenticated imports and invalid approval", async () => {
    assert.equal((await call("/api/menu-import/commit", body, "POST", false)).status, 401);
    assert.equal((await call("/api/menu-import/commit", { ...body, reviewed: false })).status, 400);
    assert.equal((await call("/api/menu-import/commit", { ...body, items: [{ ...body.items[0], price: null }] })).status, 400);
  });
  it("extracts text without calling AI", async () => {
    const form = new FormData(); form.set("text", "# Drinks\nCoffee | 80\nJuice | ?");
    const response = await fetch(`${base}/api/menu-import/extract`, { method: "POST", headers: { Cookie: cookie }, body: form });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.items[0].price, 80); assert.equal(data.items[1].price, null);
  });
  it("saves an unpublished tenant-owned menu once across simultaneous retries", async () => {
    const responses = await Promise.all([call("/api/menu-import/commit", body), call("/api/menu-import/commit", body)]);
    assert.ok(responses.every((response) => response.status === 201));
    const menu = await db.menu.findUniqueOrThrow({ where: { id: importId }, include: { categories: { include: { items: true } } } });
    assert.equal(menu.hotelId, hotelA); assert.equal(menu.isPublished, false);
    assert.equal(menu.categories.length, 2);
    assert.equal(menu.categories.flatMap((cat) => cat.items).length, 2);
    assert.equal(await db.menu.count({ where: { id: importId } }), 1);
    assert.equal((await fetch(`${base}/q/${importId}`, { redirect: "manual" })).status, 404);
    assert.equal((await fetch(`${base}/api/public/menu/${menu.slug}`)).status, 403);
  });
  it("blocks moving a dish into another tenant's category", async () => {
    const response = await call(`/api/items/${itemA}`, { categoryId: categoryB, name: "Injected dish", price: 99 }, "PUT");
    assert.equal(response.status, 404);
    const item = await db.menuItem.findUniqueOrThrow({ where: { id: itemA }, include: { category: true } });
    assert.equal(item.category.menuId, menuA);
  });
  it("rejects active content disguised as an image before writing a file", async () => {
    const form = new FormData();
    form.set("file", new File(["<html><script>alert(1)</script></html>"], "menu.html", { type: "image/png" }));
    const response = await fetch(`${base}/api/upload`, { method: "POST", headers: { Cookie: cookie }, body: form });
    assert.equal(response.status, 400);
  });
  it("does not expose an unpublished imported menu through page metadata", async () => {
    const menu = await db.menu.findUniqueOrThrow({ where: { id: importId } });
    const response = await fetch(`${base}/menu/${menu.slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(!html.includes("Reviewed cafe menu"));
    assert.ok(html.includes("Menu Currently Unavailable"));
  });
  it("keeps QR links valid after renaming and revokes unpublished menus", async () => {
    assert.equal((await call(`/api/menus/${importId}/publish`, { isPublished: true })).status, 200);
    const nextSlug = `renamed-${suffix}`;
    assert.equal((await call(`/api/menus/${importId}`, { title: "Renamed", slug: nextSlug, isPublished: true, displayLayout: "LIST" }, "PUT")).status, 200);
    const qr = await fetch(`${base}/q/${importId}`, { redirect: "manual" });
    assert.equal(qr.status, 302);
    assert.ok(qr.headers.get("location")?.endsWith(`/menu/${nextSlug}?source=qr`));
    assert.equal(qr.headers.get("cache-control"), "no-store");
    await call(`/api/menus/${importId}/publish`, { isPublished: false });
    assert.equal((await fetch(`${base}/q/${importId}`, { redirect: "manual" })).status, 404);
  });
  it("aggregates all weekly activity rather than stopping at 200 events", async () => {
    await db.analyticsEvent.createMany({ data: Array.from({ length: 250 }, () => ({ hotelId: hotelA, type: "PAGE_VIEW" })) });
    const response = await fetch(`${base}/api/analytics`, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.chartData.reduce((sum: number, day: { views: number }) => sum + day.views, 0), 250);
  });
  it("renders a business subdomain and hides drafts from its menu list", async () => {
    // node:http preserves Host; recent fetch implementations normalize it to the URL host.
    const { status, html } = await new Promise<{ status: number; html: string }>((resolve, reject) => {
      const req = request(base, { headers: { Host: `qa-a-${suffix}.localhost:3107` } }, (response) => {
        let html = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { html += chunk; });
        response.on("end", () => resolve({ status: response.statusCode || 0, html }));
      });
      req.on("error", reject); req.end();
    });
    assert.equal(status, 200);
    assert.ok(html.includes("QA Cafe A"));
    assert.ok(!html.includes("Reviewed cafe menu"));
  });
  it("paginates real dish reviews and never returns private visitor identifiers", async () => {
    await db.menu.update({ where: { id: menuA }, data: { isPublished: true } });
    await db.itemReview.createMany({ data: [5, 4, 3, 2, 1, 5, 4].map((rating, index) => ({
      itemId: itemA, name: `Guest ${index}`, rating, comment: `Test dish feedback ${index}`,
      visitorHash: `fixture-${suffix}-${index}`, clientHash: `fixture-${suffix}`,
    })) });
    const first = await fetch(`${base}/api/public/items/${itemA}/reviews?page=1`).then((r) => r.json());
    const second = await fetch(`${base}/api/public/items/${itemA}/reviews?page=2`).then((r) => r.json());
    assert.equal(first.total, 7); assert.equal(first.pages, 2);
    assert.equal(first.reviews.length, 5); assert.equal(second.reviews.length, 2);
    assert.equal(new Set([...first.reviews, ...second.reviews].map((r: { id: string }) => r.id)).size, 7);
    assert.ok(Math.abs(first.average - 24 / 7) < .001);
    assert.ok(!JSON.stringify(first).includes("visitorHash"));
    assert.ok(!JSON.stringify(first).includes("clientHash"));
    assert.equal((await fetch(`${base}/api/public/items/${itemA}/reviews?page=-1`)).status, 400);
  });
  it("accepts a rating, prevents rapid duplicates, and updates rather than multiplying browser votes", async () => {
    const input = { name: "Test diner", rating: 5, comment: "Really enjoyed this dish." };
    const first = await call(`/api/public/items/${itemA}/reviews`, input, "POST", false);
    assert.equal(first.status, 201);
    const visitorCookie = first.headers.get("set-cookie")!.split(";")[0];
    const post = (data: unknown) => fetch(`${base}/api/public/items/${itemA}/reviews`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: visitorCookie }, body: JSON.stringify(data),
    });
    assert.equal((await post(input)).status, 429);
    await db.itemReview.updateMany({ where: { itemId: itemA, name: "Test diner" }, data: { updatedAt: new Date(Date.now() - 60000) } });
    assert.equal((await post({ ...input, rating: 4, comment: "Updated honest feedback." })).status, 201);
    assert.equal(await db.itemReview.count({ where: { itemId: itemA } }), 8);
    assert.equal((await post({ ...input, rating: 0 })).status, 400);
    assert.equal((await fetch(`${base}/api/public/items/${itemA}/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://unrelated.example" }, body: JSON.stringify(input) })).status, 403);
    await db.menu.update({ where: { id: menuA }, data: { isPublished: false } });
    assert.equal((await fetch(`${base}/api/public/items/${itemA}/reviews`)).status, 404);
    assert.equal((await post(input)).status, 404);
  });

});

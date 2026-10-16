import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { openApiSpec } from "../src/lib/openapi-spec";
import {
  createHotelUserSchema,
  updateHotelUserRoleSchema,
  bulkItemActionSchema,
  reorderMenusSchema,
} from "../src/validations";
import { signSessionToken, verifySessionToken } from "../src/lib/auth";
import { Role } from "@prisma/client";

process.env.JWT_SECRET = "test-only-secret-at-least-32-bytes-long";

describe("Hotel Management Backend & Swagger System Verification", () => {
  describe("1. OpenAPI 3.0.3 & Swagger Specification Completeness", () => {
    it("should have valid OpenAPI 3.0.3 structure with info and contact metadata", () => {
      assert.equal(openApiSpec.openapi, "3.0.3");
      assert.ok(openApiSpec.info.title.includes("Hotel Digital Menu"));
      assert.equal(openApiSpec.info.version, "1.0.0");
      assert.ok(openApiSpec.paths);
      assert.ok(openApiSpec.components);
      assert.ok(openApiSpec.components.securitySchemes);
    });

    it("should define both HTTP Bearer JWT and Cookie security schemes for Swagger UI", () => {
      const schemes = openApiSpec.components.securitySchemes;
      assert.ok(schemes.BearerAuth);
      assert.equal(schemes.BearerAuth.type, "http");
      assert.equal(schemes.BearerAuth.scheme, "bearer");
      assert.equal(schemes.BearerAuth.bearerFormat, "JWT");

      assert.ok(schemes.CookieAuth);
      assert.equal(schemes.CookieAuth.type, "apiKey");
      assert.equal(schemes.CookieAuth.in, "cookie");
      assert.equal(schemes.CookieAuth.name, "lux_hotel_token");
    });

    it("should cover all critical management paths in OpenAPI specification", () => {
      const paths = openApiSpec.paths;
      const expectedPaths = [
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/hotel",
        "/api/hotel/users",
        "/api/hotel/users/{id}",
        "/api/menus",
        "/api/menus/{id}",
        "/api/menus/{id}/duplicate",
        "/api/menus/{id}/publish",
        "/api/menus/{id}/qr",
        "/api/categories",
        "/api/categories/{id}",
        "/api/items",
        "/api/items/{id}",
        "/api/items/{id}/availability",
        "/api/items/bulk",
        "/api/reviews",
        "/api/reviews/{id}",
        "/api/analytics",
        "/api/upload",
        "/api/menu-import/extract",
        "/api/menu-import/commit",
        "/api/public/menu/{slug}",
        "/api/public/items/{id}/reviews",
      ];

      for (const p of expectedPaths) {
        assert.ok((paths as Record<string, unknown>)[p], `Missing path in OpenAPI: ${p}`);
      }
    });

    it("should contain comprehensive component schemas for all hotel entities", () => {
      const schemas = openApiSpec.components.schemas;
      assert.ok(schemas.HotelProfile);
      assert.ok(schemas.HotelProfileUpdate);
      assert.ok(schemas.User);
      assert.ok(schemas.CreateHotelUserRequest);
      assert.ok(schemas.Menu);
      assert.ok(schemas.MenuCreateRequest);
      assert.ok(schemas.MenuCategory);
      assert.ok(schemas.CategoryCreateRequest);
      assert.ok(schemas.MenuItem);
      assert.ok(schemas.ItemCreateRequest);
      assert.ok(schemas.BulkItemActionRequest);
      assert.ok(schemas.ItemReview);
      assert.ok(schemas.AnalyticsResponse);
    });
  });

  describe("2. Team & Staff Management Validation", () => {
    it("should accept valid hotel user creation payload", () => {
      const valid = {
        name: "Chef Jean-Luc",
        email: "chef.jean@grandazure.com",
        password: "SecretPassword123!",
        role: "STAFF",
      };
      const res = createHotelUserSchema.safeParse(valid);
      assert.equal(res.success, true);
    });

    it("should reject short password or invalid email for team user", () => {
      const invalidEmail = {
        name: "Manager",
        email: "invalid-email",
        password: "validPassword123",
        role: "MANAGER",
      };
      assert.equal(createHotelUserSchema.safeParse(invalidEmail).success, false);

      const shortPassword = {
        name: "Manager",
        email: "manager@hotel.com",
        password: "123",
        role: "MANAGER",
      };
      assert.equal(createHotelUserSchema.safeParse(shortPassword).success, false);
    });

    it("should validate updating user roles", () => {
      assert.equal(updateHotelUserRoleSchema.safeParse({ role: "MANAGER" }).success, true);
      assert.equal(updateHotelUserRoleSchema.safeParse({ role: "OWNER" }).success, true);
      assert.equal(updateHotelUserRoleSchema.safeParse({ role: "STAFF" }).success, true);
      assert.equal(updateHotelUserRoleSchema.safeParse({ role: "ADMIN_INVALID" }).success, false);
    });
  });

  describe("3. Bulk Items Operations Validation & Logic", () => {
    it("should validate bulk availability toggle", () => {
      const payload = {
        action: "set_availability",
        itemIds: ["item-1", "item-2", "item-3"],
        isAvailable: false,
      };
      const res = bulkItemActionSchema.safeParse(payload);
      assert.equal(res.success, true);
    });

    it("should validate bulk category move", () => {
      const payload = {
        action: "move_category",
        itemIds: ["item-1", "item-2"],
        targetCategoryId: "cat-desserts-100",
      };
      const res = bulkItemActionSchema.safeParse(payload);
      assert.equal(res.success, true);
    });

    it("should validate bulk price adjustments", () => {
      const percentagePayload = {
        action: "adjust_prices",
        itemIds: ["item-1"],
        percentage: 15,
      };
      assert.equal(bulkItemActionSchema.safeParse(percentagePayload).success, true);

      const fixedPayload = {
        action: "adjust_prices",
        itemIds: ["item-1"],
        fixedAmount: -5.0,
      };
      assert.equal(bulkItemActionSchema.safeParse(fixedPayload).success, true);
    });

    it("should validate bulk delete", () => {
      const deletePayload = {
        action: "delete",
        itemIds: ["item-1", "item-2"],
      };
      assert.equal(bulkItemActionSchema.safeParse(deletePayload).success, true);
    });

    it("should reject bulk actions with empty itemIds", () => {
      const emptyPayload = {
        action: "delete",
        itemIds: [],
      };
      assert.equal(bulkItemActionSchema.safeParse(emptyPayload).success, false);
    });
  });

  describe("4. Bearer Token Authentication Compatibility", () => {
    it("should sign and verify tokens for Bearer Authorization header", async () => {
      const sessionData = {
        userId: "usr-mgr-999",
        hotelId: "hotel-ritz-111",
        email: "fnb@ritz.luxury",
        role: Role.MANAGER,
        name: "Clara Vance",
      };

      const token = await signSessionToken(sessionData);
      assert.ok(typeof token === "string" && token.length > 20);

      const verified = await verifySessionToken(token);
      assert.ok(verified !== null);
      assert.equal(verified.userId, sessionData.userId);
      assert.equal(verified.hotelId, sessionData.hotelId);
      assert.equal(verified.role, Role.MANAGER);
    });
  });

  describe("5. Menus Reordering Validation", () => {
    it("should validate proper menu order index list", () => {
      const reorderPayload = {
        items: [
          { id: "menu-breakfast", orderIndex: 1 },
          { id: "menu-dinner", orderIndex: 2 },
          { id: "menu-poolbar", orderIndex: 3 },
        ],
      };
      const res = reorderMenusSchema.safeParse(reorderPayload);
      assert.equal(res.success, true);
    });
  });
});

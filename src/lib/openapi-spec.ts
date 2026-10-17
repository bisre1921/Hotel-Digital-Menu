/**
 * OpenAPI 3.0.3 Specification for Hotel Digital Menu
 * Full Backend Management & Guest API
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Hotel Digital Menu - Management & Operations API",
    version: "1.0.0",
    description: `
**The Ultimate Hotel & Restaurant Digital Menu Management Platform**

This comprehensive backend API empowers hotel general managers, F&B directors, and culinary teams to:
* Manage multi-tenant hotel profiles, branding themes, and currencies.
* Create and organize menus (Breakfast, All-Day Dining, Rooftop Lounge, Room Service, Pool Bar).
* Organize categorized dishes with multi-currency pricing, dietary flags (VEGAN, GLUTEN_FREE, HALAL, etc.), allergens, calorie counts, preparation times, and high-resolution media.
* Execute live kitchen operations: instant 86'd availability toggles and bulk price/availability batch operations.
* Generate and export vector SVG and high-resolution PNG QR codes tied to stable immutable URLs.
* Review real-time visitor analytics, QR scan volumes, and dish review feedback.
* Manage hotel staff and role-based permissions (OWNER, MANAGER, STAFF).

### Authentication
Protected endpoints require authentication. You can authenticate in either of two ways:
1. **Bearer Token**: Send an \`Authorization: Bearer <token>\` header. Obtain the token from \`POST /api/auth/login\` or \`POST /api/auth/register\`.
2. **Session Cookie**: The \`lux_hotel_token\` HTTP-only cookie set automatically upon login or registration.
    `,
    contact: {
      name: "Hotel Digital Menu Engineering Team",
      email: "support@hoteldigitalmenu.io",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Server",
    },
  ],
  tags: [
    { name: "Authentication & Session", description: "Manager and staff onboarding, login, logout, and session profile" },
    { name: "Hotel Profile & Team", description: "Hotel branding settings, luxury styling, currency, and staff permissions" },
    { name: "Menus & Publishing", description: "Menu creation, deep duplication, live publishing, and QR code generation" },
    { name: "Menu Categories", description: "Menu section organization, ordering, and category details" },
    { name: "Menu Items & Dishes", description: "Dish catalog, allergen tracking, pricing, and live kitchen availability toggling" },
    { name: "Bulk Operations", description: "Batch operations for fast hotel kitchen workflows (bulk 86, bulk move, bulk pricing)" },
    { name: "Reviews & Feedback", description: "Manager moderation of guest dish ratings and feedback" },
    { name: "Analytics & Metrics", description: "Real-time QR scans, page views, and menu engagement analytics" },
    { name: "Media & Uploads", description: "Secure upload of dish photos, videos, and branding logos with binary verification" },
    { name: "AI & Menu Import", description: "Smart menu OCR and text extraction into structured drafts" },
    { name: "Public Guest Access", description: "Endpoints consumed by guests viewing menus and submitting dish reviews" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication & Session"],
        summary: "Register new hotel and owner account",
        description: "Creates a new hotel tenant, an OWNER user, and a starter default menu with a sample category and dish.",
        operationId: "registerHotel",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Hotel and user registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "User email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication & Session"],
        summary: "Log in hotel manager or staff member",
        description: "Authenticates credentials and returns a signed JWT token along with setting the `lux_hotel_token` session cookie.",
        operationId: "loginUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
              },
            },
          },
          "401": { description: "Invalid email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication & Session"],
        summary: "Log out active session",
        description: "Clears the active hotel manager session cookie.",
        operationId: "logoutUser",
        responses: {
          "200": {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication & Session"],
        summary: "Get current user profile and hotel context",
        description: "Returns the authenticated user details and their associated hotel tenant.",
        operationId: "getCurrentUser",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          "200": {
            description: "Current user and hotel context",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    authenticated: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                    hotel: { $ref: "#/components/schemas/HotelProfile" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthenticated" },
        },
      },
    },
    "/api/hotel": {
      get: {
        tags: ["Hotel Profile & Team"],
        summary: "Get hotel profile, branding, and statistics",
        operationId: "getHotelProfile",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          "200": {
            description: "Hotel profile data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HotelProfile" } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
      put: {
        tags: ["Hotel Profile & Team"],
        summary: "Update hotel branding, contact info, and theme",
        operationId: "updateHotelProfile",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/HotelProfileUpdate" } } },
        },
        responses: {
          "200": {
            description: "Hotel profile updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    hotel: { $ref: "#/components/schemas/HotelProfile" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/hotel/users": {
      get: {
        tags: ["Hotel Profile & Team"],
        summary: "List hotel team members",
        description: "Returns all managers and staff belonging to the authenticated hotel.",
        operationId: "listHotelUsers",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          "200": {
            description: "List of hotel staff and managers",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        tags: ["Hotel Profile & Team"],
        summary: "Add a new manager or staff member",
        description: "Creates a new team member under the hotel tenant with specified role (OWNER, MANAGER, STAFF).",
        operationId: "createHotelUser",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateHotelUserRequest" } } },
        },
        responses: {
          "201": {
            description: "Team member created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "403": { description: "Forbidden - Owner privilege required for Owner role" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/api/hotel/users/{id}": {
      get: {
        tags: ["Hotel Profile & Team"],
        summary: "Get team member details",
        operationId: "getHotelUser",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "User ID" }],
        responses: {
          "200": { description: "User found", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "404": { description: "User not found" },
        },
      },
      put: {
        tags: ["Hotel Profile & Team"],
        summary: "Update user role",
        operationId: "updateHotelUserRole",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: { role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Role updated successfully" },
          "403": { description: "Forbidden" },
          "404": { description: "User not found" },
        },
      },
      delete: {
        tags: ["Hotel Profile & Team"],
        summary: "Remove user from hotel team",
        operationId: "deleteHotelUser",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User removed successfully" },
          "400": { description: "Cannot delete self or sole owner" },
          "403": { description: "Forbidden" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/menus": {
      get: {
        tags: ["Menus & Publishing"],
        summary: "List all hotel menus",
        description: "Fetches all menus for the hotel with category count, dish count, public URLs, and optional filtering.",
        operationId: "listMenus",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Filter menus by title, description or slug" },
          { name: "published", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Filter by publication status" },
          { name: "layout", in: "query", schema: { type: "string", enum: ["GRID", "LIST", "CARDS", "MAGAZINE"] }, description: "Filter by layout" },
        ],
        responses: {
          "200": {
            description: "List of hotel menus",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Menu" } } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Menus & Publishing"],
        summary: "Create a new menu",
        description: "Creates a new menu with unique slug and automatically generated vector QR code.",
        operationId: "createMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MenuCreateRequest" } } },
        },
        responses: {
          "200": {
            description: "Menu created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    menu: { $ref: "#/components/schemas/Menu" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation failed" },
        },
      },
    },
    "/api/menus/{id}": {
      get: {
        tags: ["Menus & Publishing"],
        summary: "Get menu details and full hierarchy",
        description: "Retrieves complete menu tree including ordered categories, nested items, and public URL.",
        operationId: "getMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Menu details", content: { "application/json": { schema: { $ref: "#/components/schemas/MenuDetail" } } } },
          "404": { description: "Menu not found" },
        },
      },
      put: {
        tags: ["Menus & Publishing"],
        summary: "Update menu metadata and layout",
        operationId: "updateMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MenuCreateRequest" } } },
        },
        responses: {
          "200": { description: "Menu updated successfully" },
          "404": { description: "Menu not found" },
        },
      },
      delete: {
        tags: ["Menus & Publishing"],
        summary: "Delete menu",
        description: "Cascades deletion to all underlying categories and menu items.",
        operationId: "deleteMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Menu deleted successfully" },
          "404": { description: "Menu not found" },
        },
      },
    },
    "/api/menus/{id}/duplicate": {
      post: {
        tags: ["Menus & Publishing"],
        summary: "Deep clone menu tree",
        description: "Duplicates an entire menu including all categories, items, prices, dietary tags, and badges into a draft menu.",
        operationId: "duplicateMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Duplicated menu created as draft" },
          "404": { description: "Menu not found" },
        },
      },
    },
    "/api/menus/{id}/publish": {
      post: {
        tags: ["Menus & Publishing"],
        summary: "Toggle or set menu publication status",
        description: "Publishes or unpublishes a menu. Unpublished menus cannot be scanned or viewed by guests.",
        operationId: "publishMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { isPublished: { type: "boolean", description: "If omitted, toggles current state" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Publication status updated" },
          "404": { description: "Menu not found" },
        },
      },
    },
    "/api/menus/{id}/qr": {
      get: {
        tags: ["Menus & Publishing"],
        summary: "Generate or download branded QR code",
        description: "Generates high-resolution SVG or PNG QR codes with customized colors. Links to stable immutable redirect URL.",
        operationId: "getMenuQrCode",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["svg", "png"], default: "svg" } },
          { name: "dark", in: "query", schema: { type: "string", default: "#131418" }, description: "QR code dark module hex color" },
          { name: "light", in: "query", schema: { type: "string", default: "#FFFFFF" }, description: "QR code background hex color" },
          { name: "download", in: "query", schema: { type: "boolean", default: false }, description: "Return as file download attachment" },
        ],
        responses: {
          "200": {
            description: "QR Code file or data",
            content: {
              "image/svg+xml": { schema: { type: "string" } },
              "image/png": { schema: { type: "string", format: "binary" } },
              "application/json": { schema: { type: "object", properties: { dataUrl: { type: "string" }, publicUrl: { type: "string" } } } },
            },
          },
          "404": { description: "Menu not found" },
        },
      },
    },
    "/api/menus/{id}/export": {
      get: {
        tags: ["Hotel Menus"],
        summary: "Export full menu hierarchy as JSON backup",
        description: "Returns the complete menu data with all ordered courses, items, dietary tags, allergens, and hotel metadata. Supports ?download=true for browser attachment download.",
        operationId: "exportMenuJson",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "download", in: "query", schema: { type: "boolean", default: false }, description: "Return as downloadable JSON attachment" },
        ],
        responses: {
          "200": {
            description: "Menu hierarchy JSON data",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Menu not found" },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Menu Categories"],
        summary: "List categories",
        description: "Returns all categories for a menu or across all hotel menus with item counts.",
        operationId: "listCategories",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "menuId", in: "query", schema: { type: "string" }, description: "Filter categories by Menu ID" },
          { name: "includeItems", in: "query", schema: { type: "boolean", default: false }, description: "Include dishes in response" },
        ],
        responses: {
          "200": { description: "List of categories", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/MenuCategory" } } } } },
        },
      },
      post: {
        tags: ["Menu Categories"],
        summary: "Create category under a menu",
        operationId: "createCategory",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryCreateRequest" } } },
        },
        responses: {
          "201": { description: "Category created" },
          "400": { description: "Validation failed" },
          "404": { description: "Menu not found" },
        },
      },
      put: {
        tags: ["Menu Categories"],
        summary: "Batch reorder categories",
        description: "Updates orderIndex across categories in an atomic transaction.",
        operationId: "reorderCategories",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReorderRequest" } } },
        },
        responses: {
          "200": { description: "Categories reordered successfully" },
        },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Menu Categories"],
        summary: "Get category details and items",
        operationId: "getCategory",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Category details", content: { "application/json": { schema: { $ref: "#/components/schemas/MenuCategory" } } } },
          "404": { description: "Category not found" },
        },
      },
      put: {
        tags: ["Menu Categories"],
        summary: "Update category",
        operationId: "updateCategory",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryUpdateRequest" } } },
        },
        responses: {
          "200": { description: "Category updated" },
          "404": { description: "Category not found" },
        },
      },
      delete: {
        tags: ["Menu Categories"],
        summary: "Delete category and nested dishes",
        operationId: "deleteCategory",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Category deleted" },
          "404": { description: "Category not found" },
        },
      },
    },
    "/api/items": {
      get: {
        tags: ["Menu Items & Dishes"],
        summary: "Search and filter dishes catalog",
        description: "Search and filter dishes by menu, category, keywords, availability, dietary tags, allergens, and pagination.",
        operationId: "listItems",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "menuId", in: "query", schema: { type: "string" } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by dish name or description" },
          { name: "available", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "isChefSpecial", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "isFeatured", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "dietaryTag", in: "query", schema: { type: "string" }, description: "e.g. VEGAN, GLUTEN_FREE, HALAL" },
          { name: "allergen", in: "query", schema: { type: "string" }, description: "e.g. NUTS, DAIRY, SHELLFISH" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
        ],
        responses: {
          "200": {
            description: "List of dishes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/MenuItem" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Menu Items & Dishes"],
        summary: "Create new menu item / dish",
        operationId: "createItem",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ItemCreateRequest" } } },
        },
        responses: {
          "201": { description: "Dish created" },
          "400": { description: "Validation failed" },
          "404": { description: "Category not found in hotel" },
        },
      },
      put: {
        tags: ["Menu Items & Dishes"],
        summary: "Batch reorder items within a category",
        operationId: "reorderItems",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReorderRequest" } } },
        },
        responses: {
          "200": { description: "Items reordered successfully" },
        },
      },
    },
    "/api/items/{id}": {
      get: {
        tags: ["Menu Items & Dishes"],
        summary: "Get dish details and review stats",
        operationId: "getItem",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Dish details", content: { "application/json": { schema: { $ref: "#/components/schemas/MenuItem" } } } },
          "404": { description: "Dish not found" },
        },
      },
      put: {
        tags: ["Menu Items & Dishes"],
        summary: "Update dish details, prices, or badges",
        operationId: "updateItem",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ItemCreateRequest" } } },
        },
        responses: {
          "200": { description: "Dish updated" },
          "404": { description: "Dish not found" },
        },
      },
      delete: {
        tags: ["Menu Items & Dishes"],
        summary: "Delete dish",
        operationId: "deleteItem",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Dish deleted" },
          "404": { description: "Dish not found" },
        },
      },
    },
    "/api/items/{id}/availability": {
      patch: {
        tags: ["Menu Items & Dishes"],
        summary: "Toggle dish availability (Instant 86'd kitchen toggle)",
        description: "Instantly mark a dish as available or sold-out. Reflects immediately on live guest digital menus.",
        operationId: "toggleItemAvailability",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { isAvailable: { type: "boolean", description: "If omitted, flips current boolean" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Availability toggled",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    isAvailable: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
          "404": { description: "Dish not found" },
        },
      },
    },
    "/api/items/bulk": {
      post: {
        tags: ["Bulk Operations"],
        summary: "Bulk execute operations on dishes",
        description: `
Execute powerful batch operations on multiple dishes at once:
* \`set_availability\`: Bulk mark items available or sold-out.
* \`move_category\`: Move multiple items into another category in one step.
* \`adjust_prices\`: Apply percentage (e.g. +10% or -15%) or flat amount price changes.
* \`delete\`: Bulk remove multiple items.
        `,
        operationId: "bulkItemAction",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BulkItemActionRequest" } } },
        },
        responses: {
          "200": {
            description: "Bulk operation finished",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    action: { type: "string" },
                    count: { type: "integer" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid action or parameters" },
          "404": { description: "One or more item IDs or target category not found" },
        },
      },
    },
    "/api/reviews": {
      get: {
        tags: ["Reviews & Feedback"],
        summary: "List and monitor guest reviews",
        description: "Returns guest reviews across dishes with rating filters, search, and overall rating metrics.",
        operationId: "listManagerReviews",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "menuId", in: "query", schema: { type: "string" } },
          { name: "itemId", in: "query", schema: { type: "string" } },
          { name: "minRating", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
          { name: "maxRating", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 25 } },
        ],
        responses: {
          "200": {
            description: "Reviews list and summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reviews: { type: "array", items: { $ref: "#/components/schemas/ItemReview" } },
                    summary: {
                      type: "object",
                      properties: { totalAllReviews: { type: "integer" }, averageRating: { type: "number" } },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/reviews/{id}": {
      delete: {
        tags: ["Reviews & Feedback"],
        summary: "Moderate / delete guest review",
        description: "Removes an inappropriate or abusive review from a dish.",
        operationId: "deleteManagerReview",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Review deleted successfully" },
          "404": { description: "Review not found" },
        },
      },
    },
    "/api/analytics": {
      get: {
        tags: ["Analytics & Metrics"],
        summary: "Get hotel menu performance & 7-day traffic chart",
        description: "Calculates total menu count, live dishes, availability rates, QR scans, page views, and 7-day trend breakdown.",
        operationId: "getAnalyticsMetrics",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          "200": {
            description: "Analytics metrics and chart data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsResponse" } } },
          },
        },
      },
      post: {
        tags: ["Analytics & Metrics"],
        summary: "Record guest interaction event",
        description: "Logs public events such as QR scans, menu page views, and search activity.",
        operationId: "recordAnalyticsEvent",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["menuSlug", "type"],
                properties: {
                  menuSlug: { type: "string" },
                  type: { type: "string", enum: ["PAGE_VIEW", "QR_SCAN", "ITEM_VIEW", "SEARCH"] },
                  itemId: { type: "string", nullable: true },
                  metadata: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Event recorded" },
        },
      },
    },
    "/api/upload": {
      post: {
        tags: ["Media & Uploads"],
        summary: "Upload image or video asset",
        description: "Secures asset upload with magic byte verification against file-signature spoofing. Supports JPG, PNG, WEBP, GIF, MP4, WEBM.",
        operationId: "uploadMedia",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "Image (max 15MB) or Video (max 60MB)" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Asset uploaded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    url: { type: "string", example: "/uploads/dish-caviar.jpg" },
                    filename: { type: "string" },
                    mimeType: { type: "string" },
                    type: { type: "string", enum: ["image", "video"] },
                    size: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid media format or spoofed binary" },
        },
      },
    },
    "/api/menu-import/extract": {
      post: {
        tags: ["AI & Menu Import"],
        summary: "Extract candidate items from raw text or uploaded documents",
        description: "Parses pasted text or PDF/image menus into structured dish candidates for manager review.",
        operationId: "extractMenu",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Raw menu text" },
                  files: { type: "array", items: { type: "string", format: "binary" }, description: "Up to 5 images or PDFs" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Extracted dish items" },
          "422": { description: "Could not parse menu" },
        },
      },
    },
    "/api/menu-import/commit": {
      post: {
        tags: ["AI & Menu Import"],
        summary: "Commit reviewed menu import",
        description: "Atomically creates an unpublished draft menu with the approved imported categories and dishes.",
        operationId: "commitMenuImport",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["importId", "title", "reviewed", "items"],
                properties: {
                  importId: { type: "string" },
                  title: { type: "string" },
                  reviewed: { type: "boolean" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["category", "name", "price"],
                      properties: {
                        category: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Imported draft menu created" },
          "400": { description: "Incomplete review or missing prices" },
        },
      },
    },
    "/api/public/menu/{slug}": {
      get: {
        tags: ["Public Guest Access"],
        summary: "View public menu for guests",
        description: "Returns the live published menu tree with hotel styling. Unpublished menus require tenant preview authorization.",
        operationId: "getPublicMenu",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "preview", in: "query", schema: { type: "boolean", default: false }, description: "Enables preview for unpublished drafts if authenticated" },
        ],
        responses: {
          "200": { description: "Guest menu tree" },
          "403": { description: "Menu unpublished" },
          "404": { description: "Menu not found" },
        },
      },
    },
    "/api/public/items/{id}/reviews": {
      get: {
        tags: ["Public Guest Access"],
        summary: "Get guest dish reviews (paginated)",
        operationId: "getPublicItemReviews",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        ],
        responses: {
          "200": { description: "Paginated dish reviews without private visitor identifiers" },
          "404": { description: "Dish not accepting reviews" },
        },
      },
      post: {
        tags: ["Public Guest Access"],
        summary: "Submit guest dish review",
        description: "Guest review submission with cryptographic visitor rate limiting and anti-spam protection.",
        operationId: "submitItemReview",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "rating", "comment"],
                properties: {
                  name: { type: "string", maxLength: 60 },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  comment: { type: "string", maxLength: 1500 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Review submitted" },
          "429": { description: "Rate limited" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Pass token as `Authorization: Bearer <token>`. Obtain from /api/auth/login or /api/auth/register",
      },
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "lux_hotel_token",
        description: "HTTP-only session cookie set automatically upon login",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "manager@grandazure.com" },
          password: { type: "string", format: "password", example: "LuxuryPassword2026!" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["hotelName", "email", "password", "name"],
        properties: {
          hotelName: { type: "string", example: "The Grand Azure Resort & Spa" },
          email: { type: "string", format: "email", example: "generalmanager@grandazure.com" },
          password: { type: "string", minLength: 6, example: "SecretLuxury123!" },
          name: { type: "string", example: "Alexandre De La Tour" },
          currency: { type: "string", default: "USD", example: "USD" },
          currencySymbol: { type: "string", default: "$", example: "$" },
          city: { type: "string", example: "Santorini" },
          country: { type: "string", example: "Greece" },
        },
      },
      AuthSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          token: { type: "string", description: "JWT Bearer Token" },
          user: { $ref: "#/components/schemas/User" },
          hotel: { $ref: "#/components/schemas/HotelProfile" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
          avatarUrl: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateHotelUserRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", example: "Chef Marco Pierre" },
          email: { type: "string", format: "email", example: "marco@grandazure.com" },
          password: { type: "string", minLength: 6, example: "KitchenChef2026!" },
          role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"], default: "STAFF" },
        },
      },
      HotelProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "The Grand Azure Resort & Spa" },
          slug: { type: "string", example: "the-grand-azure" },
          tagline: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          starRating: { type: "integer", example: 5 },
          phone: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          website: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          logoUrl: { type: "string", nullable: true },
          coverImageUrl: { type: "string", nullable: true },
          primaryColor: { type: "string", example: "#B89334" },
          accentColor: { type: "string", example: "#131418" },
          fontFamily: { type: "string", enum: ["serif", "sans"], default: "serif" },
          currency: { type: "string", default: "USD" },
          currencySymbol: { type: "string", default: "$" },
        },
      },
      HotelProfileUpdate: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          tagline: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          starRating: { type: "integer", minimum: 1, maximum: 5 },
          phone: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          website: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          logoUrl: { type: "string", nullable: true },
          coverImageUrl: { type: "string", nullable: true },
          primaryColor: { type: "string", example: "#B89334" },
          accentColor: { type: "string", example: "#131418" },
          fontFamily: { type: "string", enum: ["serif", "sans"] },
          currency: { type: "string" },
          currencySymbol: { type: "string" },
        },
      },
      Menu: {
        type: "object",
        properties: {
          id: { type: "string" },
          hotelId: { type: "string" },
          title: { type: "string", example: "Rooftop Sunset Lounge & Cocktails" },
          slug: { type: "string", example: "rooftop-sunset-lounge" },
          description: { type: "string", nullable: true },
          headerImageUrl: { type: "string", nullable: true },
          isPublished: { type: "boolean", example: true },
          publishedAt: { type: "string", format: "date-time", nullable: true },
          displayLayout: { type: "string", enum: ["GRID", "LIST", "CARDS", "MAGAZINE"] },
          currencyOverride: { type: "string", nullable: true },
          categoryCount: { type: "integer", example: 4 },
          itemCount: { type: "integer", example: 28 },
          publicUrl: { type: "string", example: "http://localhost:3000/menu/rooftop-sunset-lounge" },
        },
      },
      MenuDetail: {
        allOf: [
          { $ref: "#/components/schemas/Menu" },
          {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: { $ref: "#/components/schemas/MenuCategory" },
              },
            },
          },
        ],
      },
      MenuCreateRequest: {
        type: "object",
        required: ["title", "slug"],
        properties: {
          title: { type: "string", example: "All-Day Dining & Bar" },
          slug: { type: "string", example: "all-day-dining-bar" },
          description: { type: "string", nullable: true },
          headerImageUrl: { type: "string", nullable: true },
          isPublished: { type: "boolean", default: false },
          displayLayout: { type: "string", enum: ["GRID", "LIST", "CARDS", "MAGAZINE"], default: "GRID" },
          currencyOverride: { type: "string", nullable: true },
        },
      },
      MenuCategory: {
        type: "object",
        properties: {
          id: { type: "string" },
          menuId: { type: "string" },
          name: { type: "string", example: "Signature Main Courses" },
          description: { type: "string", nullable: true },
          orderIndex: { type: "integer", example: 1 },
          imageUrl: { type: "string", nullable: true },
          isActive: { type: "boolean", example: true },
          items: { type: "array", items: { $ref: "#/components/schemas/MenuItem" } },
        },
      },
      CategoryCreateRequest: {
        type: "object",
        required: ["menuId", "name"],
        properties: {
          menuId: { type: "string" },
          name: { type: "string", example: "Signature Main Courses" },
          description: { type: "string", nullable: true },
          orderIndex: { type: "integer", default: 0 },
          imageUrl: { type: "string", nullable: true },
          isActive: { type: "boolean", default: true },
        },
      },
      CategoryUpdateRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
          orderIndex: { type: "integer" },
          imageUrl: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      MenuItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          categoryId: { type: "string" },
          name: { type: "string", example: "Wagyu A5 Striploin" },
          description: { type: "string", example: "Truffle potato purée, glazed wild chanterelles" },
          price: { type: "number", example: 165.0 },
          discountPrice: { type: "number", nullable: true, example: 150.0 },
          imageUrl: { type: "string", nullable: true },
          videoUrl: { type: "string", nullable: true },
          isAvailable: { type: "boolean", example: true },
          isChefSpecial: { type: "boolean", example: true },
          isFeatured: { type: "boolean", example: true },
          orderIndex: { type: "integer", example: 1 },
          calories: { type: "integer", example: 780 },
          prepTimeMinutes: { type: "integer", example: 25 },
          dietaryTags: { type: "array", items: { type: "string" }, example: ["GLUTEN_FREE"] },
          allergens: { type: "array", items: { type: "string" }, example: ["DAIRY"] },
          averageRating: { type: "number", nullable: true, example: 4.8 },
          totalReviews: { type: "integer", example: 12 },
        },
      },
      ItemCreateRequest: {
        type: "object",
        required: ["categoryId", "name", "price"],
        properties: {
          categoryId: { type: "string" },
          name: { type: "string", example: "Lobster Thermidor" },
          description: { type: "string", example: "Cognac cream sauce, gruyère gratinée" },
          price: { type: "number", minimum: 0, example: 88.0 },
          discountPrice: { type: "number", minimum: 0, nullable: true },
          imageUrl: { type: "string", nullable: true },
          videoUrl: { type: "string", nullable: true },
          isAvailable: { type: "boolean", default: true },
          isChefSpecial: { type: "boolean", default: false },
          isFeatured: { type: "boolean", default: false },
          orderIndex: { type: "integer", default: 0 },
          calories: { type: "integer", nullable: true },
          prepTimeMinutes: { type: "integer", nullable: true },
          dietaryTags: { type: "array", items: { type: "string" }, default: [] },
          allergens: { type: "array", items: { type: "string" }, default: [] },
        },
      },
      BulkItemActionRequest: {
        type: "object",
        required: ["action", "itemIds"],
        properties: {
          action: { type: "string", enum: ["set_availability", "move_category", "adjust_prices", "delete"] },
          itemIds: { type: "array", items: { type: "string" }, minItems: 1 },
          isAvailable: { type: "boolean", description: "Required when action is set_availability" },
          targetCategoryId: { type: "string", description: "Required when action is move_category" },
          percentage: { type: "number", description: "Percentage change for adjust_prices, e.g. 10 for +10%" },
          fixedAmount: { type: "number", description: "Fixed currency change for adjust_prices, e.g. 5.00" },
        },
      },
      ReorderRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "orderIndex"],
              properties: { id: { type: "string" }, orderIndex: { type: "integer" } },
            },
          },
        },
      },
      ItemReview: {
        type: "object",
        properties: {
          id: { type: "string" },
          itemId: { type: "string" },
          name: { type: "string", example: "Sophie M." },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Exquisite presentation and melt-in-your-mouth tenderness." },
          createdAt: { type: "string", format: "date-time" },
          item: {
            type: "object",
            properties: { id: { type: "string" }, name: { type: "string" } },
          },
        },
      },
      AnalyticsResponse: {
        type: "object",
        properties: {
          metrics: {
            type: "object",
            properties: {
              totalMenus: { type: "integer" },
              publishedMenus: { type: "integer" },
              totalItems: { type: "integer" },
              availableItems: { type: "integer" },
              chefSpecialCount: { type: "integer" },
              availabilityRate: { type: "integer", example: 96 },
              totalScans: { type: "integer" },
              totalViews: { type: "integer" },
            },
          },
          chartData: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", example: "2026-10-15" },
                scans: { type: "integer" },
                views: { type: "integer" },
              },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "object", nullable: true },
        },
      },
    },
  },
};

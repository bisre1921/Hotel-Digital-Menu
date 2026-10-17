# Hotel Digital Menu — End-to-End Backend & API Integration Guide

This document is the complete, production-ready integration guide for the **Hotel Digital Menu** backend. It covers system architecture, authentication standards, multi-tenant boundaries, and detailed specifications for all endpoints.

---

## 1. Quick Reference & Discovery

| Resource | URL | Description |
| :--- | :--- | :--- |
| **Interactive Swagger UI** | `http://localhost:3000/docs` *(or `/api/docs`)* | Browser-based API explorer with "Try it out" and Bearer auth modal |
| **OpenAPI 3.0.3 Spec (JSON)** | `http://localhost:3000/api/openapi.json` | Machine-readable schema for Postman, code generators, and SDKs |
| **Admin Portal** | `http://localhost:3000/admin` | Web management interface for hotel managers and F&B teams |
| **Guest Menu Experience** | `http://localhost:3000/menu/:slug` | Real-time guest menu view optimized for mobile & tablet |

---

## 2. Architecture & Multi-Tenant Design

The platform enforces strict **multi-tenant isolation** using PostgreSQL and Prisma:

- **Hotel Tenant Boundary**: Every user, menu, category, item, and review belongs to a specific `hotelId`.
- **Tenant Isolation Rule**: A user session belonging to `Hotel A` cannot view, mutate, or access resources of `Hotel B`. Attempted cross-tenant access returns `404 Not Found` or `403 Forbidden`.
- **Dual Authentication**:
  1. **HTTP Bearer Token**: Sent via `Authorization: Bearer <token>` header (best for mobile apps, external POS, Swagger UI).
  2. **HTTP-Only Session Cookie**: `lux_hotel_token` automatically set upon login and registration (best for web browsers).

### Role-Based Access Control (RBAC)

| Role | Permissions |
| :--- | :--- |
| **`OWNER`** | Full hotel control: branding, currency, menu CRUD, team user creation/deletion, review moderation |
| **`MANAGER`** | Menu management, category/dish CRUD, kitchen live toggling, staff invites, review moderation |
| **`STAFF`** | Dish availability 86'd toggle, menu viewing, order readiness monitoring |

---

## 3. Authentication & Session Endpoints

### 3.1 Register Hotel & Owner Account
Creates a new hotel tenant, an `OWNER` account, and an initial starter menu with a sample category and dish.

- **Method / Route**: `POST /api/auth/register`
- **Auth Required**: No

#### Request Body
```json
{
  "hotelName": "Grand Azure Resort & Spa",
  "email": "owner@grandazure.com",
  "password": "Password123!",
  "name": "Jean-Luc Moreau",
  "currency": "USD",
  "currencySymbol": "$",
  "city": "Santorini",
  "country": "Greece"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "2d4bbf21-189c-4c6d-b5bc-c9ee941b0512",
    "email": "owner@grandazure.com",
    "name": "Jean-Luc Moreau",
    "role": "OWNER",
    "hotelId": "c1733838-1c89-4b81-a481-7434619fa760"
  },
  "hotel": {
    "id": "c1733838-1c89-4b81-a481-7434619fa760",
    "name": "Grand Azure Resort & Spa",
    "slug": "grand-azure-resort-spa",
    "currency": "USD",
    "currencySymbol": "$"
  }
}
```

---

### 3.2 Login
Authenticates an existing user and returns a signed JWT token along with setting the `lux_hotel_token` session cookie.

- **Method / Route**: `POST /api/auth/login`
- **Auth Required**: No

#### Request Body
```json
{
  "email": "admin@grandazure.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "2d4bbf21-189c-4c6d-b5bc-c9ee941b0512",
    "email": "admin@grandazure.com",
    "name": "Jean-Luc Moreau",
    "role": "OWNER",
    "hotelId": "c1733838-1c89-4b81-a481-7434619fa760"
  },
  "hotel": {
    "id": "c1733838-1c89-4b81-a481-7434619fa760",
    "name": "The Grand Azure Resort & Spa",
    "slug": "the-grand-azure",
    "primaryColor": "#B89334",
    "logoUrl": "https://..."
  }
}
```

---

### 3.3 Current Session Profile (`me`)
Fetches the current user profile and hotel context.

- **Method / Route**: `GET /api/auth/me`
- **Auth Required**: Yes (`Bearer <token>` or `Cookie`)

#### Response (`200 OK`)
```json
{
  "authenticated": true,
  "user": {
    "id": "2d4bbf21-189c-4c6d-b5bc-c9ee941b0512",
    "email": "admin@grandazure.com",
    "name": "Jean-Luc Moreau",
    "role": "OWNER",
    "hotelId": "c1733838-1c89-4b81-a481-7434619fa760"
  },
  "hotel": {
    "id": "c1733838-1c89-4b81-a481-7434619fa760",
    "name": "The Grand Azure Resort & Spa",
    "slug": "the-grand-azure",
    "starRating": 5,
    "currency": "EUR",
    "currencySymbol": "€"
  }
}
```

---

### 3.4 Logout
Clears the active browser session cookie.

- **Method / Route**: `POST /api/auth/logout`
- **Auth Required**: No

---

## 4. Hotel Profile & Team Management

### 4.1 Get Hotel Details & Statistics
- **Method / Route**: `GET /api/hotel`
- **Auth Required**: Yes

#### Response (`200 OK`)
```json
{
  "id": "c1733838-1c89-4b81-a481-7434619fa760",
  "name": "The Grand Azure Resort & Spa",
  "slug": "the-grand-azure",
  "tagline": "Timeless luxury overlooking the Aegean Sea",
  "starRating": 5,
  "phone": "+30 22860 12345",
  "email": "concierge@grandazure.com",
  "website": "https://grandazure.luxury",
  "primaryColor": "#B89334",
  "accentColor": "#131418",
  "fontFamily": "serif",
  "currency": "EUR",
  "currencySymbol": "€",
  "_count": {
    "menus": 3,
    "users": 2
  }
}
```

---

### 4.2 Update Hotel Branding & Theme
- **Method / Route**: `PUT /api/hotel`
- **Auth Required**: Yes (`OWNER` or `MANAGER`)

#### Request Body
```json
{
  "name": "The Grand Azure Resort & Spa",
  "tagline": "Timeless luxury on the cliffs of Oia",
  "description": "Michelin-starred Mediterranean dining.",
  "starRating": 5,
  "phone": "+30 22860 12345",
  "email": "concierge@grandazure.com",
  "website": "https://grandazure.luxury",
  "address": "Caldera Promenade 4",
  "city": "Oia, Santorini",
  "country": "Greece",
  "primaryColor": "#B89334",
  "accentColor": "#131418",
  "fontFamily": "serif",
  "currency": "EUR",
  "currencySymbol": "€"
}
```

---

### 4.3 List Hotel Team Members
- **Method / Route**: `GET /api/hotel/users`
- **Auth Required**: Yes (`OWNER` or `MANAGER`)

#### Response (`200 OK`)
```json
[
  {
    "id": "usr-1",
    "name": "Jean-Luc Moreau",
    "email": "admin@grandazure.com",
    "role": "OWNER",
    "avatarUrl": "https://...",
    "createdAt": "2026-10-16T08:40:30.493Z"
  },
  {
    "id": "usr-2",
    "name": "Elena Vasiliou",
    "email": "manager@grandazure.com",
    "role": "MANAGER",
    "avatarUrl": null,
    "createdAt": "2026-10-16T08:40:30.505Z"
  }
]
```

---

### 4.4 Add Staff or Manager Account
- **Method / Route**: `POST /api/hotel/users`
- **Auth Required**: Yes (`OWNER` or `MANAGER`)

#### Request Body
```json
{
  "name": "Chef Marco Pierre",
  "email": "marco@grandazure.com",
  "password": "ChefPassword2026!",
  "role": "STAFF"
}
```

---

### 4.5 Update Team Member Role
- **Method / Route**: `PUT /api/hotel/users/:id`
- **Auth Required**: Yes (`OWNER` required to assign or modify `OWNER` role)

#### Request Body
```json
{
  "role": "MANAGER"
}
```

---

### 4.6 Remove Team Member
- **Method / Route**: `DELETE /api/hotel/users/:id`
- **Auth Required**: Yes (`OWNER` or `MANAGER`)
- **Protections**: Cannot delete your own active account; cannot delete the sole owner of a hotel.

---

## 5. Menus & QR Code Operations

### 5.1 List Menus
- **Method / Route**: `GET /api/menus`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` *(string, optional)*: Filter by title, slug, or description
  - `published` *(string: `true` \| `false`, optional)*: Filter by publication status
  - `layout` *(string: `GRID` \| `LIST` \| `CARDS` \| `MAGAZINE`, optional)*

#### Response (`200 OK`)
```json
[
  {
    "id": "menu-1",
    "hotelId": "c1733838-1c89-4b81-a481-7434619fa760",
    "title": "L'Étoile Fine Dining & Tasting",
    "slug": "azure-letoile-dinner",
    "description": "An avant-garde exploration of Aegean bounty paired with rare vintages.",
    "isPublished": true,
    "displayLayout": "GRID",
    "categoryCount": 4,
    "itemCount": 24,
    "publicUrl": "http://localhost:3000/menu/azure-letoile-dinner"
  }
]
```

---

### 5.2 Create Menu
- **Method / Route**: `POST /api/menus`
- **Auth Required**: Yes

#### Request Body
```json
{
  "title": "Rooftop Sunset Lounge",
  "slug": "rooftop-sunset-lounge",
  "description": "Handcrafted cocktails and artisanal tapas",
  "isPublished": true,
  "displayLayout": "GRID",
  "currencyOverride": null
}
```

---

### 5.3 Get Full Menu Tree
Retrieves the menu with all ordered categories and nested dishes.

- **Method / Route**: `GET /api/menus/:id`
- **Auth Required**: Yes

---

### 5.4 Update Menu
- **Method / Route**: `PUT /api/menus/:id`
- **Auth Required**: Yes

---

### 5.5 Delete Menu
Deletes the menu and cascades deletion to all categories and dishes.

- **Method / Route**: `DELETE /api/menus/:id`
- **Auth Required**: Yes

---

### 5.6 Deep Duplicate Menu Tree (1-Click Clone)
Clones an entire menu including all categories, items, prices, dietary tags, and badges into an unpublished draft.

- **Method / Route**: `POST /api/menus/:id/duplicate`
- **Auth Required**: Yes

---

### 5.7 Toggle / Set Publication Status
Publishes or unpublishes a menu. Unpublished menus are blocked from guest access.

- **Method / Route**: `POST /api/menus/:id/publish`
- **Auth Required**: Yes

#### Request Body *(Optional)*
```json
{
  "isPublished": true
}
```
*(If omitted, automatically flips the current publication boolean)*.

---

### 5.8 Generate & Export Branded QR Codes
Generates vector SVG or high-resolution PNG QR codes pointing to immutable redirect URLs (`/q/:id`).

- **Method / Route**: `GET /api/menus/:id/qr`
- **Auth Required**: No (publicly verifiable)
- **Query Parameters**:
  - `format` *(string: `svg` \| `png`, default: `svg`)*
  - `dark` *(string hex color, default: `#131418`)*
  - `light` *(string hex color, default: `#FFFFFF`)*
  - `download` *(boolean: `true` \| `false`, default: `false`)* — When `true`, returns a downloadable file attachment.

---

### 5.9 Export Menu Hierarchy (JSON Backup)
Exports the entire menu tree with all ordered categories, dishes, prices, dietary tags, allergens, and hotel metadata for backups or POS integration.

- **Method / Route**: `GET /api/menus/:id/export`
- **Auth Required**: Yes (`STAFF`, `MANAGER`, or `OWNER`)
- **Query Parameters**:
  - `download` *(boolean: `true` \| `false`, default: `false`)* — When `true`, sets `Content-Disposition: attachment` for browser downloads.

#### Response (`200 OK`)
```json
{
  "version": "1.0",
  "exportedAt": "2026-10-16T15:45:00.000Z",
  "hotel": {
    "id": "c1733838-1c89-4b81-a481-7434619fa760",
    "name": "The Grand Azure Resort & Spa",
    "currency": "EUR",
    "currencySymbol": "€"
  },
  "menu": {
    "id": "menu-uuid",
    "title": "L'Étoile Fine Dining & Tasting",
    "slug": "azure-letoile-dinner",
    "isPublished": true,
    "displayLayout": "GRID"
  },
  "categories": [
    {
      "id": "cat-uuid",
      "name": "Starters & Appetizers",
      "orderIndex": 1,
      "items": [
        {
          "id": "item-uuid",
          "name": "Oscietra Royal Caviar",
          "price": 145.0,
          "dietaryTags": ["PESCATARIAN"],
          "allergens": ["DAIRY", "GLUTEN"]
        }
      ]
    }
  ]
}
```

---

## 6. Category Operations

### 6.1 List Categories
- **Method / Route**: `GET /api/categories`
- **Auth Required**: Yes
- **Query Parameters**:
  - `menuId` *(string, optional)*: Filter categories by specific menu
  - `includeItems` *(boolean, default: `false`)*: Include nested dishes in response

---

### 6.2 Create Category
- **Method / Route**: `POST /api/categories`
- **Auth Required**: Yes

#### Request Body
```json
{
  "menuId": "menu-uuid",
  "name": "Artisanal Cocktails",
  "description": "Curated by our resident mixologists",
  "orderIndex": 1,
  "isActive": true
}
```

---

### 6.3 Update Category
- **Method / Route**: `PUT /api/categories/:id`
- **Auth Required**: Yes

---

### 6.4 Delete Category
- **Method / Route**: `DELETE /api/categories/:id`
- **Auth Required**: Yes

---

### 6.5 Reorder Categories
Atomically updates the display order index for categories.

- **Method / Route**: `PUT /api/categories`
- **Auth Required**: Yes

#### Request Body
```json
{
  "items": [
    { "id": "cat-uuid-1", "orderIndex": 1 },
    { "id": "cat-uuid-2", "orderIndex": 2 }
  ]
}
```

---

## 7. Dish / Menu Item Operations

### 7.1 Search & Filter Dishes Catalog
- **Method / Route**: `GET /api/items`
- **Auth Required**: Yes
- **Query Parameters**:
  - `menuId` *(string, optional)*
  - `categoryId` *(string, optional)*
  - `search` *(string, optional)*: Search in item name or description
  - `available` *(string: `true` \| `false`)*
  - `isChefSpecial` *(string: `true` \| `false`)*
  - `isFeatured` *(string: `true` \| `false`)*
  - `dietaryTag` *(string, e.g. `VEGAN`, `GLUTEN_FREE`, `HALAL`)*
  - `allergen` *(string, e.g. `DAIRY`, `NUTS`)*
  - `page` *(integer, default: 1)*
  - `limit` *(integer, default: 50, max: 100)*

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "item-uuid",
      "name": "Oscietra Royal Caviar",
      "description": "30g Golden Oscietra on warm brioche",
      "price": 145.0,
      "discountPrice": 130.0,
      "isAvailable": true,
      "isChefSpecial": true,
      "isFeatured": true,
      "calories": 340,
      "prepTimeMinutes": 12,
      "dietaryTags": ["PESCATARIAN"],
      "allergens": ["DAIRY", "GLUTEN", "FISH"],
      "category": {
        "id": "cat-uuid",
        "name": "Starters"
      }
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### 7.2 Create Dish
- **Method / Route**: `POST /api/items`
- **Auth Required**: Yes

#### Request Body
```json
{
  "categoryId": "cat-uuid",
  "name": "Wagyu A5 Striploin",
  "description": "Truffle potato purée, glazed wild chanterelles",
  "price": 165.0,
  "discountPrice": 150.0,
  "imageUrl": "/uploads/wagyu.jpg",
  "videoUrl": null,
  "isAvailable": true,
  "isChefSpecial": true,
  "isFeatured": true,
  "calories": 780,
  "prepTimeMinutes": 25,
  "dietaryTags": ["GLUTEN_FREE"],
  "allergens": ["DAIRY"]
}
```

---

### 7.3 Instant Kitchen Availability Toggle (86'd Dish)
Live toggle to mark items sold-out or available immediately on guest mobile menus.

- **Method / Route**: `PATCH /api/items/:id/availability`
- **Auth Required**: Yes (`STAFF`, `MANAGER`, or `OWNER`)

#### Request Body *(Optional)*
```json
{
  "isAvailable": false
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "isAvailable": false,
  "item": { "id": "item-uuid", "isAvailable": false }
}
```

---

### 7.4 Bulk Operations on Dishes
Execute batch operations across multiple dishes in a single request.

- **Method / Route**: `POST /api/items/bulk`
- **Auth Required**: Yes

#### Action 1: Bulk Set Availability
```json
{
  "action": "set_availability",
  "itemIds": ["item-1", "item-2", "item-3"],
  "isAvailable": false
}
```

#### Action 2: Bulk Move Category
```json
{
  "action": "move_category",
  "itemIds": ["item-1", "item-2"],
  "targetCategoryId": "cat-uuid"
}
```

#### Action 3: Bulk Price Adjustments
Supports percentage changes (e.g. `+10%` or `-15%`) or flat amount adjustments:
```json
{
  "action": "adjust_prices",
  "itemIds": ["item-1", "item-2"],
  "percentage": 10
}
```

#### Action 4: Bulk Delete
```json
{
  "action": "delete",
  "itemIds": ["item-1", "item-2"]
}
```

---

## 8. Guest Reviews & Management Moderation

### 8.1 Manager Reviews Dashboard
- **Method / Route**: `GET /api/reviews`
- **Auth Required**: Yes
- **Query Parameters**:
  - `menuId` *(string, optional)*
  - `itemId` *(string, optional)*
  - `minRating` *(integer: 1–5, optional)*
  - `maxRating` *(integer: 1–5, optional)*
  - `search` *(string, optional)*
  - `page` *(integer, default: 1)*
  - `limit` *(integer, default: 25)*

#### Response (`200 OK`)
```json
{
  "reviews": [
    {
      "id": "rev-uuid",
      "name": "Sophie M.",
      "rating": 5,
      "comment": "Exquisite presentation and melt-in-your-mouth tenderness.",
      "createdAt": "2026-10-15T18:30:00.000Z",
      "item": {
        "id": "item-uuid",
        "name": "Wagyu A5 Striploin"
      }
    }
  ],
  "summary": {
    "totalAllReviews": 142,
    "averageRating": 4.8
  },
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

---

### 8.2 Delete / Moderate Review
Deletes spam or inappropriate reviews.

- **Method / Route**: `DELETE /api/reviews/:id`
- **Auth Required**: Yes (`OWNER` or `MANAGER`)

---

## 9. Media & File Uploads

### 9.1 Upload Image or Video Asset
Secure binary upload with magic-byte verification against file spoofing.

- **Method / Route**: `POST /api/upload`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **File Field**: `file` (Image max 15MB: JPEG, PNG, WebP, GIF; Video max 60MB: MP4, WebM)

#### Response (`200 OK`)
```json
{
  "success": true,
  "url": "/uploads/dish-caviar.jpg",
  "filename": "dish-caviar.jpg",
  "mimeType": "image/jpeg",
  "type": "image",
  "size": 2451000
}
```

---

## 10. Real-Time Analytics

### 10.1 Get Hotel Analytics & Trends
- **Method / Route**: `GET /api/analytics`
- **Auth Required**: Yes

#### Response (`200 OK`)
```json
{
  "metrics": {
    "totalMenus": 4,
    "publishedMenus": 3,
    "totalItems": 86,
    "availableItems": 82,
    "chefSpecialCount": 12,
    "availabilityRate": 95,
    "totalScans": 3410,
    "totalViews": 9850
  },
  "chartData": [
    { "date": "2026-10-10", "scans": 420, "views": 1240 },
    { "date": "2026-10-11", "scans": 530, "views": 1490 }
  ]
}
```

---

## 11. Public Guest Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/public/menu/:slug` | Public menu view (supports `?preview=true` for authenticated manager preview) |
| `GET` | `/api/public/items/:id/reviews` | Paginated reviews without private visitor identifiers |
| `POST` | `/api/public/items/:id/reviews` | Guest review submission with cryptographic rate-limiting |
| `POST` | `/api/analytics` | Track QR scan (`QR_SCAN`) and menu view (`PAGE_VIEW`) |

---

## 12. Code Integration Example (TypeScript / Fetch)

```typescript
const BASE_URL = "http://localhost:3000";

// 1. Authenticate & Obtain Token
async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.token;
}

// 2. Fetch Menus using Bearer Token
async function getMenus(token: string) {
  const res = await fetch(`${BASE_URL}/api/menus`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return await res.json();
}

// 3. Toggle Dish Availability (Kitchen 86'd)
async function toggleAvailability(token: string, itemId: string, isAvailable: boolean) {
  const res = await fetch(`${BASE_URL}/api/items/${itemId}/availability`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isAvailable }),
  });

  return await res.json();
}
```

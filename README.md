# LuxMenu — Premium Hotel Digital Menu SaaS

A modern, production-grade hotel digital menu platform built from scratch with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **PostgreSQL**, and **Prisma ORM**.

Designed specifically for luxury hotels, boutique resorts, and fine dining establishments, LuxMenu enables guests to instantly view contactless, interactive digital menus by scanning high-definition QR codes, while providing hoteliers with a secure, multi-tenant administrative dashboard.

---

## 🌟 Key Features

### 1. Guest-Facing Public Digital Menu (`/menu/[slug]`)
- **Instant Zero-Friction Access**: No mobile app installation or guest login required.
- **Dynamic Hotel Branding**: Adapts colors, typography, logos, and hero covers to match each hotel's identity.
- **Flexible Layout Options**: Switch seamlessly between **Photo Grid**, **Luxury Cards**, and **Minimalist List**.
- **Interactive Culinary Presentation**: Supports high-resolution imagery, video dish presentations, and Chef's Special badges.
- **Live Search & Dietary Filtering**: Instant search across titles and ingredients with filters for *Vegan, Vegetarian, Gluten-Free, Halal, Dairy-Free, Nut-Free*, and *Chef's Specials*.
- **Comprehensive Allergen Alerts**: Explicit allergen indicators (Dairy, Gluten, Shellfish, Peanuts, Eggs, etc.) with safety warnings.
- **Item Detail Modal**: Displays preparation times, calorie counts, full provenance descriptions, and video players.
- **Share & QR Studio**: Guests can copy links or display the high-res table QR code to share with companions.
- **Full Light & Dark Mode**: Persistent theme toggle across all guest views.

### 2. Multi-Tenant Hotel Admin Dashboard (`/admin`)
- **Strict Tenant Isolation & Role-Based Access Control (RBAC)**: Multi-tenant architecture with `OWNER`, `ADMIN`, `MANAGER`, and `STAFF` roles where each property accesses and manages only its own menus, categories, dishes, staff, and analytics.
- **Overview Analytics**: Real-time KPIs tracking total menus, active dishes, availability percentage, mobile QR scans, guest reviews, and page views.
- **Streamlined Menu Catalog & 1-Click Templates (`/admin/menus`)**:
  - Manage independent menus for distinct outlets (e.g., Fine Dining Dinner, Rooftop Lounge, Room Service Breakfast).
  - **1-Click Preset Templates**: Instantly scaffold menus with pre-built categories using *Fine Dining Dinner*, *All-Day Café & Bistro*, *Ethiopian Traditional*, *Pool & Lounge Bar*, or *Room Service* templates.
- **Interactive Menu Builder (`/admin/menus/[id]`)**:
  - **1-Click Category Starter Chips**: Populate empty menus with common course structures in one click.
  - **Inline Quick-Add Dish Bar**: Rapidly type `Dish Name` + `Price` and press `Enter` to add dishes back-to-back without opening a modal.
  - **2-Tab Dish Modal**: Cleanly organized into **1. Essential Details** (Name, Price, Category, Description, Photo) and **2. Dietary, Allergens & Media** (Prep time, Calories, Spice level, Dietary tags, Allergens, Video URL).
  - **Instant Availability Toggle (86'd)**: Mark items sold out with one click—instantly reflected on guest table menus.
  - **Bulk Dish Operations**: Batch toggle availability, move categories, adjust prices by percentage or fixed amount, batch-assign media, or delete items.
- **AI Menu Import Studio & Visual Asset Extraction (`/admin/menus/import`)**:
  - **Multi-Format Capture**: Import menus from photographed menu pages, PDFs, or pasted text using **Google Cloud Vertex AI (Gemini 2.5 Flash)** or **Gemini API**.
  - **Automatic Dish Photo Extraction (`imageBox`)**: AI detects individual dish photos embedded on printed menu pages (`0..1000` normalized bounding boxes) and automatically crops, optimizes, and attaches each photo to its corresponding dish via `sharp`.
  - **Automatic Hotel / Café Brand & Logo Extraction (`brand` & `logoBox`)**: Automatically extracts the printed `businessName`, `menuTitle`, `tagline`, and crops the header **logo image** from the uploaded menu—with a one-click **"Apply to Hotel Profile"** toggle to update the hotel's branding upon import commit.
  - **Split-Screen Review Studio**: Sticky source document/image inspector on the left, compact scannable dish cards on the right with category filter pills, search, unresolved-price filter, and quick-price buttons (`+50`, `+100`, `Free`).
- **Smart Batch Photo & Video Matcher (`BatchMediaModal`)**:
  - Available inside both the **AI Menu Import Studio** and the **Menu Editor** via the **"Smart Batch Photos & Videos"** button.
  - Upload a folder or batch of named dish photos and videos at once and let the fuzzy matcher pair each file with the right dish automatically:
    - **Compact & Delimited Filenames**: `firfirtibs.jpg`, `firfir-tibs.png`, `firfir_tibs.webp` $\rightarrow$ **Firfir Tibs**
    - **Consonant-Skeleton Shorthand**: `frfrtbs.img`, `drwt.jpeg` $\rightarrow$ **Firfir Tibs**, **Doro Wat**
    - **Bilingual / Split Dish Names**: `special-ful.webp` $\rightarrow$ **ፉል / Special Ful**
    - **Dish Promo Videos**: `firfir_tibs_promo.mp4`, `.webm`, `.mov` $\rightarrow$ attaches directly to the dish's `videoUrl` while images attach to `imageUrl`.
  - **`.img` & Magic-Byte Detection**: Inspects binary magic bytes (`detectMediaMimeType`) so files saved with `.img` or missing browser MIME types are validated safely and saved with canonical extensions.
  - **Interactive Confidence Preview**: Displays **Exact / High / Shorthand / Fuzzy** match badges, live image/video thumbnails, and a dropdown to override or skip any assignment before saving in a single atomic transaction.
- **Branded QR Code Studio (`/admin/qr`)**:
  - Immutable `/q/[menuId]` print-safe shortlinks and `/menu/[slug]` public routes.
  - Live vector QR preview with custom brand foreground and background color pickers.
  - **Download Vector SVG** & **High-Res PNG (600x600)**.
- **Hotel Profile & Branding (`/admin/profile`)**:
  - Custom brand colors, typography selection, Logo & Hero Banner uploads, and live interactive guest preview card.
- **Interactive OpenAPI 3.0 / Swagger Documentation (`/api-docs`)**:
  - Built-in Swagger UI backed by `/api/docs` covering authentication, profile, menus, categories, dishes, bulk item actions, team management, media, QR generation, reviews, and analytics.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript (Strict mode enabled) |
| **Styling** | Tailwind CSS with centralized design tokens & Glassmorphism |
| **Animations** | Framer Motion |
| **Database & ORM** | PostgreSQL with Prisma ORM |
| **AI & Vision Extraction** | Google Cloud Vertex AI (`gemini-2.5-flash`) & Google GenAI SDK |
| **Image Processing** | `sharp` (Automatic bounding-box dish photo & logo cropping + WebP/PNG optimization) |
| **Authentication** | Cryptographic JWT session cookies & Bearer tokens (`jose`) + `bcryptjs` password hashing |
| **API Documentation** | OpenAPI 3.0.3 & Swagger UI (`/api-docs` & `/api/docs`) |
| **Validation** | Zod schemas with React Hook Form integration + binary magic-byte media verification |
| **QR Code Engine** | `qrcode` (SVG & High-DPI PNG generation) |
| **Media Storage** | Local multi-tenant file storage (`public/uploads/[hotelId]`) with optional Cloudinary CDN |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v25)
- PostgreSQL database (running locally or cloud like Supabase/Neon/Railway)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```

   Ensure your database, JWT secret, and AI credentials are configured:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hotel_menu_db?schema=public"
   JWT_SECRET="lux-hotel-jwt-super-secret-key-32-chars-long-minimum-random"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # AI Menu Import (Vertex AI via gcloud or Gemini API key)
   GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
   GOOGLE_CLOUD_LOCATION="us-central1"
   GOOGLE_VERTEX_ACCESS_TOKEN="ya29...." # Optional: auto-refreshed via `gcloud auth print-access-token` if omitted
   GEMINI_API_KEY=""                     # Optional fallback if not using Vertex AI
   GEMINI_MODEL="gemini-2.5-flash"
   ```

3. Push the Prisma database schema:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. Seed realistic luxury hotel data:
   ```bash
   npx tsx prisma/seed.ts
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   - **Public App & Admin Portal**: `http://localhost:3000/admin`
   - **Interactive Swagger API Docs**: `http://localhost:3000/api-docs`

---

## 🔌 Core API Overview

Full interactive request/response schemas are available at **`/api-docs`** (OpenAPI JSON at **`/api/docs`**):

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/login`, `/api/auth/register`, `/api/auth/me` | `POST`, `GET` | Multi-tenant authentication (supports both HTTP-only Cookie & `Bearer` JWT) |
| `/api/hotel` | `GET`, `PUT` | Hotel profile, branding colors, typography, logo, and cover settings |
| `/api/menus`, `/api/menus/[id]`, `/api/menus/reorder` | `GET`, `POST`, `PUT`, `DELETE` | Outlet menus CRUD & display order management |
| `/api/categories`, `/api/categories/[id]` | `GET`, `POST`, `PUT`, `DELETE` | Menu categories CRUD & sorting |
| `/api/items`, `/api/items/[id]` | `GET`, `POST`, `PUT`, `DELETE` | Culinary dishes CRUD & instant availability toggling |
| `/api/items/bulk` | `POST` | Atomic bulk operations: `toggle_availability`, `move_category`, `adjust_price`, `batch_assign_media`, `delete` |
| `/api/menu-import/extract` | `POST` | AI extraction of dishes, categories, prices, dish photo crops (`imageBox`), and brand/logo (`brand.logoBox`) |
| `/api/menu-import/commit` | `POST` | Commits reviewed import draft, persists dish photos/videos, and optionally updates hotel profile branding |
| `/api/upload` | `POST` | Secure multi-tenant media upload with magic-byte detection (`.jpg`, `.png`, `.webp`, `.avif`, `.img`, `.mp4`, `.webm`, `.mov`, `.pdf`) |
| `/api/users`, `/api/users/[id]` | `GET`, `POST`, `PUT`, `DELETE` | Hotel team & staff management with role-based permissions |
| `/api/analytics`, `/api/reviews`, `/api/qr` | `GET`, `POST` | Real-time scan/view telemetry, guest feedback, and vector/raster QR generation |

---

## 🔑 Demo Hotel Credentials

The seed script creates two distinct luxury hotel tenants to test multi-tenancy and data isolation out of the box:

### Hotel 1: The Grand Azure Resort & Spa (Santorini, Greece)
- **Admin Email**: `admin@grandazure.com`
- **Password**: `Password123!`
- **Primary Outlets**:
  - L'Étoile Fine Dining: `/menu/azure-letoile-dinner`
  - Azure Sunset Pool Lounge: `/menu/azure-pool-lounge`
  - Royal Suite Breakfast (Draft): `/menu/azure-royal-breakfast`

### Hotel 2: Hôtel Saint-Germain Palais (Paris, France)
- **Admin Email**: `owner@palaisgermain.com`
- **Password**: `Password123!`
- **Primary Outlet**:
  - Le Jardin Secret Bistronomy: `/menu/saint-germain-jardin`

---

## 🧪 Automated Testing

A comprehensive automated test suite (43 tests across 16 suites) validates cryptographic auth, multi-tenant database isolation, OpenAPI 3.0 completeness, bulk item actions, AI import schemas, smart batch media matching, magic-byte file verification, and QR code engines:

```bash
npm test
```

Test coverage includes:
- Multi-tenant boundary verification (ensuring Hotel A cannot query or mutate Hotel B).
- Password hashing & JWT signing/verification (Cookie & Bearer token support).
- Smart batch filename-to-dish matching (`firfirtibs.jpg`, `firfir-tibs.png`, `frfrtbs.img`, bilingual names, and `.mp4` videos).
- Binary magic-byte MIME detection (`detectMediaMimeType`) and SVG/HTML upload spoofing prevention.
- AI menu extraction schema validation including `brand`, `logoBox`, and per-dish `imageBox` coordinates.
- OpenAPI 3.0.3 specification & RBAC team validation schemas.
- Scalable Vector SVG and PNG QR code generation with immutable `/q/[id]` links.

---

## 📦 Production Deployment

### 1. Build Verification
```bash
npm run build
```

### 2. Deployment on Vercel / Cloud Run / Node Server
- Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, and Vertex AI / Gemini credentials).
- Run `prisma migrate deploy` or `prisma db push` during build.
- For cloud storage, add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to automatically route uploads to Cloudinary CDN, or use the built-in local multi-tenant upload engine.
- Additional documentation is available in [`docs/BACKEND-INTEGRATION-GUIDE.md`](docs/BACKEND-INTEGRATION-GUIDE.md), [`docs/PRODUCT-ROADMAP.md`](docs/PRODUCT-ROADMAP.md), and [`docs/IMPORT-AND-DOMAINS.md`](docs/IMPORT-AND-DOMAINS.md).

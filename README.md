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
- **Strict Tenant Isolation**: Multi-tenant database architecture where each hotel property accesses and manages only its own menus, categories, dishes, and analytics.
- **Overview Analytics**: Real-time KPIs tracking total menus, active dishes, availability percentage, mobile QR scans, and page views.
- **Menu Catalog & Multi-Outlet Management**: Manage independent menus for distinct outlets (e.g., Fine Dining Dinner, Rooftop Lounge, Room Service Breakfast).
- **Interactive Menu Builder (`/admin/menus/[id]`)**:
  - Add, edit, and reorder courses / categories.
  - Add, edit, and reorder culinary dishes.
  - **Instant Availability Toggle (86'd)**: Mark items sold out with one click—instantly reflected on guest table menus.
  - Upload photos and MP4/WebM dish presentation videos.
- **Branded QR Code Studio**:
  - Live vector QR preview with custom brand foreground and background color pickers.
  - **Download Vector SVG**: Infinite resolution for large signage, acrylic table tents, and print banners.
  - **Download High-Res PNG**: 600x600 print-ready raster image.
  - One-click public link copying and live test scan simulation.
- **Hotel Profile & Branding (`/admin/profile`)**:
  - Custom brand colors (presets: *Luxury Gold, Burgundy Wine, Riviera Emerald, Royal Sapphire, Rose Gold* + hex picker).
  - Typography selection (*Playfair Display Serif* vs *Inter Sans*).
  - Logo and Hero Banner cover uploads.
  - Live interactive guest preview card.
- **Media Library (`/admin/media`)**:
  - Central repository of all uploaded food and beverage photos and videos.
- **Live Smartphone Simulator**:
  - Built-in mobile device simulator to preview menus in real-time directly inside the admin portal.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript (Strict mode enabled) |
| **Styling** | Tailwind CSS with centralized design tokens & Glassmorphism |
| **Animations** | Framer Motion |
| **Database & ORM** | PostgreSQL with Prisma ORM |
| **Authentication** | Cryptographic JWT session cookies (`jose`) & `bcryptjs` password hashing |
| **Validation** | Zod schemas with React Hook Form integration |
| **Icons** | Lucide React |
| **QR Code Engine** | `qrcode` (SVG & High-DPI PNG generation) |
| **Media Storage** | Local multi-tenant file storage with optional Cloudinary / S3 integration |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v25)
- PostgreSQL database (running locally or cloud like Supabase/Neon/Railway)

### Installation

1. Navigate to the project directory:
   ```bash
   cd projects/personal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```

   Ensure your `DATABASE_URL` is set:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hotel_menu_db?schema=public"
   JWT_SECRET="lux-hotel-jwt-super-secret-key-32-chars-long-minimum-random"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. Push the Prisma database schema:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

5. Seed realistic luxury hotel data:
   ```bash
   npx tsx prisma/seed.ts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser.

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

A comprehensive automated test suite validates cryptographic auth, multi-tenant database isolation, QR code engines, price formatting, and Zod schemas:

```bash
npm test
```

Test coverage includes:
- Multi-tenant boundary verification (ensuring Hotel A cannot query or mutate Hotel B).
- Password hashing & JWT signing/verification.
- Scalable Vector SVG and PNG QR code generation with custom color palettes.
- Zod schema validation for dishes, prices, and menus.
- Real PostgreSQL database persistence and item availability toggles.

---

## 📦 Production Deployment

### 1. Build Verification
```bash
npm run build
```

### 2. Deployment on Vercel / Cloud Run / Node Server
- Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`).
- Run `prisma migrate deploy` or `prisma db push` during build.
- For cloud storage, add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to automatically route uploads to Cloudinary CDN, or use the built-in local upload engine.


## Platform development

The project is expanding to cafes, restaurants and hotels. See [the delivery roadmap](docs/PRODUCT-ROADMAP.md)
for implemented features and the remaining release scope, and [import/domain setup](docs/IMPORT-AND-DOMAINS.md)
for reviewed menu capture, permanent QR links, configuration and tests.

Open **Admin → Menus → Import existing menu** to paste text or review photo/PDF extraction.
Imports create unpublished drafts; photo/PDF extraction requires server-side API configuration.

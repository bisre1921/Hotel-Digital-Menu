import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  hotelName: z.string().min(2, "Hotel name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Administrator name is required"),
  currency: z.string().default("USD"),
  currencySymbol: z.string().default("$"),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const hotelProfileSchema = z.object({
  name: z.string().min(2, "Hotel name is required"),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  starRating: z.coerce.number().min(1).max(5).default(5),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").default("#B89334"),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").default("#131418"),
  fontFamily: z.enum(["serif", "sans"]).default("serif"),
  currency: z.string().default("USD"),
  currencySymbol: z.string().default("$"),
});

export const menuSchema = z.object({
  title: z.string().min(2, "Menu title is required"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional().nullable(),
  headerImageUrl: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  displayLayout: z.enum(["GRID", "LIST", "CARDS", "MAGAZINE"]).default("GRID"),
  currencyOverride: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  orderIndex: z.coerce.number().default(0),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const itemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be positive"),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  isChefSpecial: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  orderIndex: z.coerce.number().default(0),
  calories: z.coerce.number().optional().nullable(),
  prepTimeMinutes: z.coerce.number().optional().nullable(),
  dietaryTags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      orderIndex: z.number(),
    })
  ),
});

export const reorderMenusSchema = reorderSchema;

export const createHotelUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).default("STAFF"),
});

export const updateHotelUserRoleSchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "STAFF"]),
});

export const bulkItemActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_availability"),
    itemIds: z.array(z.string()).min(1, "At least one item ID is required"),
    isAvailable: z.boolean(),
  }),
  z.object({
    action: z.literal("move_category"),
    itemIds: z.array(z.string()).min(1, "At least one item ID is required"),
    targetCategoryId: z.string().min(1, "Target category ID is required"),
  }),
  z.object({
    action: z.literal("adjust_prices"),
    itemIds: z.array(z.string()).min(1, "At least one item ID is required"),
    percentage: z.number().optional(),
    fixedAmount: z.number().optional(),
  }),
  z.object({
    action: z.literal("delete"),
    itemIds: z.array(z.string()).min(1, "At least one item ID is required"),
  }),
]);

import { z } from "zod";

export const boundingBoxSchema = z.object({
  page: z.number().int().min(0).max(4).default(0),
  ymin: z.number().min(0).max(1000),
  xmin: z.number().min(0).max(1000),
  ymax: z.number().min(0).max(1000),
  xmax: z.number().min(0).max(1000),
});
export type BoundingBox = z.infer<typeof boundingBoxSchema>;

export const extractedBrandSchema = z.object({
  businessName: z.string().max(160).default(""),
  menuTitle: z.string().max(120).default(""),
  tagline: z.string().max(240).default(""),
  logoBox: boundingBoxSchema.nullable().optional(),
});
export type ExtractedBrand = z.infer<typeof extractedBrandSchema>;

export const importRowSchema = z.object({
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  price: z.number().finite().min(0).max(1000000).nullable(),
  note: z.string().max(500).default(""),
  imageBox: boundingBoxSchema.nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  videoUrl: z.string().max(500).nullable().optional(),
});
export type ImportRow = z.infer<typeof importRowSchema>;

export const extractedMenuSchema = z.object({
  brand: extractedBrandSchema.optional(),
  items: z.array(importRowSchema).min(1).max(200),
});

export const importCommitSchema = z.object({
  importId: z.string().uuid(),
  targetMenuId: z.string().min(1).max(120).optional(),
  title: z.string().trim().min(2).max(120),
  reviewed: z.literal(true),
  items: z
    .array(
      importRowSchema.extend({
        price: z.number().finite().min(0).max(1000000),
        imageUrl: z.string().max(500).nullable().optional(),
        videoUrl: z.string().max(500).nullable().optional(),
      })
    )
    .min(1)
    .max(200),
  brandUpdate: z
    .object({
      applyToHotel: z.boolean().default(false),
      businessName: z.string().trim().max(160).optional(),
      tagline: z.string().trim().max(240).optional(),
      logoUrl: z.string().max(500).nullable().optional(),
    })
    .optional(),
});

/** Conservative, local fallback. Explicit headings and one item per line; no inferred prices. */
export function parseMenuText(text: string): ImportRow[] {
  let category = "Menu";
  const items: ImportRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#/.test(line)) {
      category = line.replace(/^#+\s*/, "").trim().slice(0, 100) || "Menu";
      continue;
    }
    // Delimiters remove ambiguity when names include sizes or numbers.
    const columns = line.split(/\t|\|/).map((part) => part.trim());
    const last = columns.at(-1)!;
    const numeric = last
      .replace(/^(?:ETB|Birr|ብር|\$|€|£)\s*/i, "")
      .replace(/\s*(?:ETB|Birr|ብር)$/i, "");
    const explicit =
      columns.length > 1 &&
      /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(numeric);
    const trailing =
      columns.length === 1
        ? line.match(
            /^(.+?)\s+(?:(?:ETB|Birr|ብር)\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)\s*(?:ETB|Birr|ብር)?$/i
          )
        : null;
    const price = explicit
      ? Number(numeric.replaceAll(",", ""))
      : trailing
        ? Number(trailing[2].replaceAll(",", ""))
        : null;
    const name = explicit
      ? columns[0]
      : trailing
        ? trailing[1].replace(/[.\s]+$/, "")
        : columns[0];
    items.push({
      category,
      name: name.slice(0, 200),
      description:
        explicit && columns.length > 2
          ? columns.slice(1, -1).join(" · ").slice(0, 2000)
          : "",
      price,
      note:
        price === null
          ? "Price not recognized. Enter it from the original menu."
          : "Check the item and price against your original menu.",
    });
  }
  return extractedMenuSchema.parse({ items }).items;
}

const boundingBoxJsonSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["page", "ymin", "xmin", "ymax", "xmax"],
  properties: {
    page: { type: "integer" },
    ymin: { type: "number" },
    xmin: { type: "number" },
    ymax: { type: "number" },
    xmax: { type: "number" },
  },
};

// Shared API schema: preserve source language, keep unreadable prices null.
export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["brand", "items"],
  properties: {
    brand: {
      type: "object",
      additionalProperties: false,
      required: ["businessName", "menuTitle", "tagline", "logoBox"],
      properties: {
        businessName: { type: "string" },
        menuTitle: { type: "string" },
        tagline: { type: "string" },
        logoBox: {
          ...boundingBoxJsonSchema,
          properties: {
            ...boundingBoxJsonSchema.properties,
            page: { type: "integer" },
          },
        },
      },
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "category",
          "name",
          "description",
          "price",
          "note",
          "imageBox",
        ],
        properties: {
          category: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: ["number", "null"] },
          note: { type: "string" },
          imageBox: {
            ...boundingBoxJsonSchema,
            properties: {
              ...boundingBoxJsonSchema.properties,
              page: { type: "integer" },
            },
          },
        },
      },
    },
  },
};

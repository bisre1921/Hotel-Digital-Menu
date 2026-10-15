import { z } from "zod";

export const importRowSchema = z.object({
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  price: z.number().finite().min(0).max(1000000).nullable(),
  note: z.string().max(500).default(""),
});
export type ImportRow = z.infer<typeof importRowSchema>;
export const extractedMenuSchema = z.object({
  items: z.array(importRowSchema).min(1).max(200),
});
export const importCommitSchema = z.object({
  importId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  reviewed: z.literal(true),
  items: z.array(importRowSchema.extend({ price: z.number().finite().min(0).max(1000000) })).min(1).max(200),
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
    const numeric = last.replace(/^(?:ETB|Birr|ብር|\$|€|£)\s*/i, "").replace(/\s*(?:ETB|Birr|ብር)$/i, "");
    const explicit = columns.length > 1 && /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(numeric);
    const trailing = columns.length === 1 ? line.match(/^(.+?)\s+(?:(?:ETB|Birr|ብር)\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)\s*(?:ETB|Birr|ብር)?$/i) : null;
    const price = explicit ? Number(numeric.replaceAll(",", "")) : trailing ? Number(trailing[2].replaceAll(",", "")) : null;
    const name = explicit ? columns[0] : trailing ? trailing[1].replace(/[.\s]+$/, "") : columns[0];
    items.push({ category, name: name.slice(0, 200), description: explicit && columns.length > 2 ? columns.slice(1, -1).join(" · ").slice(0, 2000) : "", price, note: price === null ? "Price not recognized. Enter it from the original menu." : "Check the item and price against your original menu." });
  }
  return extractedMenuSchema.parse({ items }).items;
}

// Shared API schema: preserve source language, keep unreadable prices null.
export const extractionJsonSchema = {
  type: "object", additionalProperties: false, required: ["items"],
  properties: { items: { type: "array", items: {
    type: "object", additionalProperties: false,
    required: ["category", "name", "description", "price", "note"],
    properties: {
      category: { type: "string" }, name: { type: "string" }, description: { type: "string" },
      price: { type: ["number", "null"] }, note: { type: "string" },
    },
  } } },
};

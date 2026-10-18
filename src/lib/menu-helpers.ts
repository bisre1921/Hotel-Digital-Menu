import type { ItemVariant } from "@/validations";

export type GuestLanguage = "en" | "am";

const ETHIOPIC_CHAR_REGEX = /[\u1200-\u137F]/;

export function containsEthiopicText(text?: string | null): boolean {
  if (!text) return false;
  return ETHIOPIC_CHAR_REGEX.test(text);
}

/**
 * Splits a combined bilingual string like "ፉል / Special Ful" or "Special Ful / ፉል"
 * into its English and Amharic parts when explicit `nameAm` is not set.
 */
export function splitInlineBilingual(text?: string | null): {
  en: string;
  am: string | null;
} {
  if (!text) return { en: "", am: null };
  const trimmed = text.trim();
  if (!trimmed.includes("/")) {
    return {
      en: trimmed,
      am: containsEthiopicText(trimmed) ? trimmed : null,
    };
  }

  const parts = trimmed
    .split(/\s*\/\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { en: trimmed, am: null };
  }

  const ethiopicParts = parts.filter((p) => containsEthiopicText(p));
  const latinParts = parts.filter((p) => !containsEthiopicText(p));

  if (ethiopicParts.length > 0 && latinParts.length > 0) {
    return {
      en: latinParts.join(" / "),
      am: ethiopicParts.join(" / "),
    };
  }

  return { en: trimmed, am: null };
}

/**
 * Resolves the display text for a given guest language ("en" | "am").
 * Uses explicit `amharicText` when provided, or falls back to splitting inline "አማርኛ / English" strings.
 */
export function resolveLocalizedText(
  primaryText?: string | null,
  amharicText?: string | null,
  lang: GuestLanguage = "en"
): string {
  const base = (primaryText || "").trim();
  const explicitAm = (amharicText || "").trim();
  const inline = splitInlineBilingual(base);

  if (lang === "am") {
    if (explicitAm) return explicitAm;
    if (inline.am) return inline.am;
    return base;
  }

  if (explicitAm && base) {
    return base;
  }
  if (inline.am && inline.en) {
    return inline.en;
  }
  return base;
}

/**
 * Normalizes Prisma `Json?` variants into a clean array of `{ label, price }`.
 */
export function normalizeItemVariants(variants: unknown): ItemVariant[] {
  if (!Array.isArray(variants)) return [];
  const normalized: ItemVariant[] = [];
  for (const entry of variants) {
    if (!entry || typeof entry !== "object") continue;
    const label = typeof (entry as any).label === "string" ? (entry as any).label.trim() : "";
    const rawPrice = Number((entry as any).price);
    if (label && Number.isFinite(rawPrice) && rawPrice >= 0) {
      normalized.push({
        label,
        price: Math.round(rawPrice * 100) / 100,
      });
    }
  }
  return normalized;
}

/**
 * Determines whether a menu item is Ethiopian Fasting (ጾም) friendly.
 */
export function isFastingFriendly(item: {
  name?: string | null;
  nameAm?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  dietaryTags?: string[] | null;
}): boolean {
  const tags = (item.dietaryTags || []).map((t) => t.toUpperCase());
  if (tags.includes("FASTING") || tags.includes("VEGAN")) {
    return true;
  }
  const combined = [item.name, item.nameAm, item.description, item.descriptionAm]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    combined.includes("ጾም") ||
    combined.includes("tsom") ||
    combined.includes("fasting") ||
    combined.includes("beyaynetu") ||
    combined.includes("በያይነቱ") ||
    combined.includes("shiro") ||
    combined.includes("ሽሮ")
  );
}

/**
 * Evaluates whether a scheduled menu is currently active at the given Date.
 * Supports overnight windows (e.g., 21:00 -> 02:00) and optional day-of-week filters.
 */
export function isMenuActiveNow(
  menu: {
    activeStartTime?: string | null;
    activeEndTime?: string | null;
    activeDays?: number[] | null;
  },
  now: Date = new Date()
): boolean {
  const days = Array.isArray(menu.activeDays) ? menu.activeDays : [];
  const hasStart = Boolean(menu.activeStartTime && /^\d{2}:\d{2}$/.test(menu.activeStartTime));
  const hasEnd = Boolean(menu.activeEndTime && /^\d{2}:\d{2}$/.test(menu.activeEndTime));

  if (days.length === 0 && !hasStart && !hasEnd) {
    return false;
  }

  if (days.length > 0 && !days.includes(now.getDay())) {
    return false;
  }

  if (!hasStart || !hasEnd) {
    return days.length > 0;
  }

  const [startH, startM] = menu.activeStartTime!.split(":").map(Number);
  const [endH, endM] = menu.activeEndTime!.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  // Overnight window (e.g. 21:00 to 02:00)
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatMenuSchedule(menu: {
  activeStartTime?: string | null;
  activeEndTime?: string | null;
  activeDays?: number[] | null;
}): string | null {
  const days = Array.isArray(menu.activeDays) ? menu.activeDays : [];
  const hasWindow = Boolean(menu.activeStartTime && menu.activeEndTime);
  if (!hasWindow && days.length === 0) return null;

  const dayLabel =
    days.length === 0 || days.length === 7
      ? "Daily"
      : days
          .slice()
          .sort((a, b) => a - b)
          .map((d) => SHORT_DAYS[d] || "")
          .filter(Boolean)
          .join(", ");

  if (hasWindow) {
    return `${dayLabel} · ${menu.activeStartTime}–${menu.activeEndTime}`;
  }
  return dayLabel;
}

export interface DiffItemChange {
  categoryName: string;
  name: string;
  status: "ADDED" | "PRICE_CHANGED" | "UPDATED" | "UNCHANGED";
  oldPrice?: number;
  newPrice: number;
  preservedMedia?: boolean;
}

export interface MenuImportDiffSummary {
  addedCount: number;
  priceChangedCount: number;
  updatedCount: number;
  unchangedCount: number;
  preservedMissingItemsCount: number;
  changes: DiffItemChange[];
}

function normalizeLookupKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

/**
 * Computes a non-destructive diff between an existing menu's categories/items
 * and incoming imported categories/items.
 */
export function computeMenuImportDiff(
  existingCategories: Array<{
    name: string;
    items: Array<{
      name: string;
      price: number;
      description?: string | null;
      imageUrl?: string | null;
      videoUrl?: string | null;
    }>;
  }>,
  incomingCategories: Array<{
    name: string;
    items: Array<{
      name: string;
      price: number;
      description?: string | null;
      imageUrl?: string | null;
      videoUrl?: string | null;
    }>;
  }>
): MenuImportDiffSummary {
  const existingMap = new Map<
    string,
    {
      name: string;
      price: number;
      description?: string | null;
      imageUrl?: string | null;
      videoUrl?: string | null;
    }
  >();

  let totalExistingItems = 0;
  for (const cat of existingCategories) {
    for (const item of cat.items) {
      totalExistingItems++;
      const key = normalizeLookupKey(item.name);
      if (key) existingMap.set(key, item);
    }
  }

  const matchedKeys = new Set<string>();
  const changes: DiffItemChange[] = [];
  let addedCount = 0;
  let priceChangedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const cat of incomingCategories) {
    for (const incoming of cat.items) {
      const key = normalizeLookupKey(incoming.name);
      const existing = key ? existingMap.get(key) : undefined;

      if (!existing) {
        addedCount++;
        changes.push({
          categoryName: cat.name,
          name: incoming.name,
          status: "ADDED",
          newPrice: incoming.price,
        });
        continue;
      }

      matchedKeys.add(key);
      const preservedMedia = Boolean(
        (existing.imageUrl && !incoming.imageUrl) || (existing.videoUrl && !incoming.videoUrl)
      );
      const priceDiff = Math.abs(Number(existing.price) - Number(incoming.price)) >= 0.01;
      const descDiff =
        Boolean(incoming.description?.trim()) &&
        (incoming.description || "").trim() !== (existing.description || "").trim();

      if (priceDiff) {
        priceChangedCount++;
        changes.push({
          categoryName: cat.name,
          name: incoming.name,
          status: "PRICE_CHANGED",
          oldPrice: existing.price,
          newPrice: incoming.price,
          preservedMedia,
        });
      } else if (descDiff || incoming.imageUrl || incoming.videoUrl) {
        updatedCount++;
        changes.push({
          categoryName: cat.name,
          name: incoming.name,
          status: "UPDATED",
          oldPrice: existing.price,
          newPrice: incoming.price,
          preservedMedia,
        });
      } else {
        unchangedCount++;
        changes.push({
          categoryName: cat.name,
          name: incoming.name,
          status: "UNCHANGED",
          oldPrice: existing.price,
          newPrice: incoming.price,
          preservedMedia,
        });
      }
    }
  }

  return {
    addedCount,
    priceChangedCount,
    updatedCount,
    unchangedCount,
    preservedMissingItemsCount: Math.max(0, totalExistingItems - matchedKeys.size),
    changes,
  };
}

export interface BudgetComboSuggestion {
  id: string;
  label: string;
  items: Array<{
    id: string;
    name: string;
    nameAm?: string | null;
    categoryName: string;
    price: number;
    imageUrl?: string | null;
    isFasting: boolean;
  }>;
  totalPrice: number;
  remainingBudget: number;
}

const DRINK_CATEGORY_KEYWORDS = [
  "drink",
  "beverage",
  "coffee",
  "tea",
  "juice",
  "smoothie",
  "cocktail",
  "mocktail",
  "wine",
  "beer",
  "water",
  "refreshment",
  "መጠጥ",
  "ቡና",
  "ሻይ",
  "ጭማቂ",
];

function isDrinkCategory(categoryName: string): boolean {
  const lower = categoryName.toLowerCase();
  return DRINK_CATEGORY_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Generates curated Dish + Drink (or multi-dish) meal combinations that fit within `maxBudget`.
 */
export function buildBudgetMealCombos(
  categories: Array<{
    name: string;
    items: Array<{
      id: string;
      name: string;
      nameAm?: string | null;
      description?: string | null;
      descriptionAm?: string | null;
      price: number;
      discountPrice?: number | null;
      imageUrl?: string | null;
      isAvailable?: boolean;
      dietaryTags?: string[];
    }>;
  }>,
  maxBudget: number,
  options?: { fastingOnly?: boolean; maxResults?: number }
): BudgetComboSuggestion[] {
  if (!Number.isFinite(maxBudget) || maxBudget <= 0) return [];
  const maxResults = options?.maxResults ?? 8;

  type FlatEntry = {
    id: string;
    name: string;
    nameAm?: string | null;
    categoryName: string;
    price: number;
    imageUrl?: string | null;
    isDrink: boolean;
    isFasting: boolean;
  };

  const dishes: FlatEntry[] = [];
  const drinks: FlatEntry[] = [];

  for (const cat of categories) {
    const drinkCat = isDrinkCategory(cat.name);
    for (const item of cat.items) {
      if (item.isAvailable === false) continue;
      const effectivePrice =
        item.discountPrice != null && item.discountPrice > 0 && item.discountPrice < item.price
          ? item.discountPrice
          : item.price;
      if (effectivePrice <= 0 || effectivePrice > maxBudget) continue;

      const fasting = isFastingFriendly(item);
      if (options?.fastingOnly && !fasting) continue;

      const entry: FlatEntry = {
        id: item.id,
        name: item.name,
        nameAm: item.nameAm,
        categoryName: cat.name,
        price: effectivePrice,
        imageUrl: item.imageUrl,
        isDrink: drinkCat,
        isFasting: fasting,
      };

      if (drinkCat) {
        drinks.push(entry);
      } else {
        dishes.push(entry);
      }
    }
  }

  const combos: BudgetComboSuggestion[] = [];
  const seenKeys = new Set<string>();

  // 1. Dish + Drink pairs within budget
  for (const dish of dishes) {
    for (const drink of drinks) {
      const total = Math.round((dish.price + drink.price) * 100) / 100;
      if (total <= maxBudget) {
        const key = [dish.id, drink.id].sort().join(":");
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          combos.push({
            id: key,
            label: "Main + Beverage",
            items: [dish, drink],
            totalPrice: total,
            remainingBudget: Math.round((maxBudget - total) * 100) / 100,
          });
        }
      }
    }
  }

  // 2. Two-dish combos within budget (if room remains or no drink categories exist)
  for (let i = 0; i < dishes.length; i++) {
    for (let j = i + 1; j < dishes.length; j++) {
      const d1 = dishes[i];
      const d2 = dishes[j];
      const total = Math.round((d1.price + d2.price) * 100) / 100;
      if (total <= maxBudget) {
        const key = [d1.id, d2.id].sort().join(":");
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          combos.push({
            id: key,
            label: "2-Dish Pair",
            items: [d1, d2],
            totalPrice: total,
            remainingBudget: Math.round((maxBudget - total) * 100) / 100,
          });
        }
      }
    }
  }

  // 3. Single standout dishes close to the budget
  for (const dish of dishes) {
    if (dish.price <= maxBudget) {
      const key = `single:${dish.id}`;
      combos.push({
        id: key,
        label: "Solo Dish",
        items: [dish],
        totalPrice: dish.price,
        remainingBudget: Math.round((maxBudget - dish.price) * 100) / 100,
      });
    }
  }

  // Sort by multi-item combos first, then closest to utilizing budget effectively
  combos.sort((a, b) => {
    if (a.items.length !== b.items.length) {
      return b.items.length - a.items.length;
    }
    return b.totalPrice - a.totalPrice;
  });

  return combos.slice(0, maxResults);
}

export interface DesignTokens {
  fontFamilies: {
    serif: string;
    sans: string;
  };
  colors: {
    gold: {
      light: string;
      primary: string;
      dark: string;
    };
    dark: {
      background: string;
      card: string;
      border: string;
    };
    light: {
      background: string;
      card: string;
      border: string;
    };
  };
}

export const PLATFORM_THEME: DesignTokens = {
  fontFamilies: {
    serif: "var(--font-playfair), Georgia, serif",
    sans: "var(--font-inter), system-ui, -apple-system, sans-serif",
  },
  colors: {
    gold: {
      light: "#FAF8F0",
      primary: "#B89334",
      dark: "#75561C",
    },
    dark: {
      background: "#0B0C0E",
      card: "#131418",
      border: "#24262E",
    },
    light: {
      background: "#FAF9F6",
      card: "#FFFFFF",
      border: "#E8E5DF",
    },
  },
};

export const DIETARY_OPTIONS = [
  { label: "Vegetarian", value: "VEGETARIAN", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  { label: "Vegan", value: "VEGAN", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" },
  { label: "Gluten-Free", value: "GLUTEN_FREE", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { label: "Dairy-Free", value: "DAIRY_FREE", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  { label: "Halal", value: "HALAL", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30" },
  { label: "Pescatarian", value: "PESCATARIAN", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30" },
  { label: "Nut-Free", value: "NUT_FREE", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" },
] as const;

export const ALLERGEN_OPTIONS = [
  { label: "Dairy / Milk", value: "DAIRY" },
  { label: "Gluten / Wheat", value: "GLUTEN" },
  { label: "Eggs", value: "EGGS" },
  { label: "Peanuts", value: "PEANUTS" },
  { label: "Tree Nuts", value: "TREE_NUTS" },
  { label: "Fish", value: "FISH" },
  { label: "Shellfish / Crustaceans", value: "SHELLFISH" },
  { label: "Soy", value: "SOY" },
  { label: "Sesame", value: "SESAME" },
  { label: "Sulphites", value: "SULPHITES" },
] as const;

export const MENU_LAYOUTS = [
  { id: "GRID", name: "Photo Grid", description: "Visual 2-column grid showcasing vibrant imagery" },
  { id: "CARDS", name: "Luxury Cards", description: "Spacious cards with full item descriptions and tags" },
  { id: "LIST", name: "Minimalist List", description: "Classic fine dining layout prioritizing typography" },
] as const;

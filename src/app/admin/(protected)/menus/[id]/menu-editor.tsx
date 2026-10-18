"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  QrCode,
  Settings,
  ExternalLink,
  Sparkles,
  Smartphone,
  UtensilsCrossed,
  Layers,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  CheckSquare,
  Square,
  FolderInput,
  Percent,
  DollarSign,
  Copy,
  Check,
  X,
  Zap,
  ScanLine,
  Wand2,
  Search,
  Filter,
  Tablet,
  Monitor,
  LayoutGrid,
  Table2,
  Rows3,
  BookOpen,
  LayoutList,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CategoryModal } from "./category-modal";
import { DishModal, DishFormData } from "./dish-modal";
import { QRStudio } from "./qr-studio";
import { MenuSettings } from "./menu-settings";
import { DIETARY_OPTIONS } from "@/config/theme";
import {
  BatchMediaModal,
  type RemoteMediaAssignment,
} from "@/components/menu/batch-media-modal";

const STARTER_TEMPLATES = [
  {
    id: "fine-dining",
    label: "Fine Dining",
    subtitle: "5 classic courses",
    categories: [
      { name: "Appetizers & Starters", description: "Small plates and seasonal beginnings" },
      { name: "Soups & Artisanal Salads", description: "Farm-fresh greens and chef broths" },
      { name: "Main Entrées", description: "Signature culinary creations" },
      { name: "Sides & Accompaniments", description: "Crafted to share at the table" },
      { name: "Desserts & Digestifs", description: "Sweet finales and pairings" },
    ],
  },
  {
    id: "cafe-bistro",
    label: "All-Day Café & Bistro",
    subtitle: "5 café categories",
    categories: [
      { name: "Espresso & Hot Drinks", description: "Specialty roasted coffee and teas" },
      { name: "Breakfast & Brunch", description: "Morning favorites served fresh" },
      { name: "Sandwiches & Bowls", description: "Artisan breads and wholesome bowls" },
      { name: "Pastries & Bakery", description: "Baked fresh every morning" },
      { name: "Cold Drinks & Fresh Juices", description: "Pressed juices, smoothies, and sodas" },
    ],
  },
  {
    id: "lounge-bar",
    label: "Cocktail & Wine Lounge",
    subtitle: "4 bar sections",
    categories: [
      { name: "Signature Cocktails", description: "House mixology and timeless classics" },
      { name: "Wines & Champagne", description: "Curated vintages by the glass or bottle" },
      { name: "Spirits & Craft Beer", description: "Single malts, gins, and local brews" },
      { name: "Bar Bites & Tapas", description: "Savory plates to pair with your drink" },
    ],
  },
  {
    id: "room-service",
    label: "In-Room Dining",
    subtitle: "4 suite dining sections",
    categories: [
      { name: "Morning Breakfast", description: "Delivered warm to your suite" },
      { name: "All-Day Comforts", description: "Classic hotel favorites and mains" },
      { name: "Light Fare & Salads", description: "Fresh, nourishing selections" },
      { name: "Late Night & Refreshments", description: "Sweet treats and chilled beverages" },
    ],
  },
];

interface Item {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isAvailable: boolean;
  isChefSpecial: boolean;
  isFeatured: boolean;
  orderIndex: number;
  calories?: number | null;
  prepTimeMinutes?: number | null;
  dietaryTags: string[];
  allergens: string[];
}

interface Category {
  id: string;
  menuId: string;
  name: string;
  description?: string | null;
  orderIndex: number;
  imageUrl?: string | null;
  isActive: boolean;
  items: Item[];
}

interface MenuFull {
  id: string;
  hotelId: string;
  title: string;
  slug: string;
  description?: string | null;
  headerImageUrl?: string | null;
  isPublished: boolean;
  displayLayout: "GRID" | "LIST" | "CARDS" | "MAGAZINE" | "TABLE";
  qrCodeSvg?: string | null;
  hotel: {
    id: string;
    name: string;
    currencySymbol: string;
    currency: string;
    primaryColor?: string | null;
  };
  categories: Category[];
}

interface MenuEditorProps {
  initialMenu: MenuFull;
}

export function MenuEditor({ initialMenu }: MenuEditorProps) {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuFull>(initialMenu);
  const [activeTab, setActiveTab] = useState<"dishes" | "qr" | "settings" | "preview">("dishes");
  const [isBatchMediaOpen, setIsBatchMediaOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [previewLayout, setPreviewLayout] = useState<"CARDS" | "GRID" | "TABLE" | "MAGAZINE" | "LIST">(
    initialMenu.displayLayout || "CARDS"
  );
  const [savingLayout, setSavingLayout] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [templateLoading, setTemplateLoading] = useState<string | null>(null);

  // Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Inline Quick-Add State per category
  const [quickAdd, setQuickAdd] = useState<
    Record<string, { name: string; price: string; description: string; saving?: boolean }>
  >({});

  // Inline Price Edit State
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const [duplicatingItemId, setDuplicatingItemId] = useState<string | null>(null);

  // Bulk Item Operations State (/api/items/bulk)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkMoveCategoryId, setBulkMoveCategoryId] = useState<string>("");
  const [bulkPriceMode, setBulkPriceMode] = useState<"percentage" | "fixed">("percentage");
  const [bulkPriceValue, setBulkPriceValue] = useState<string>("");

  // Dish Search & Filter State
  const [dishSearch, setDishSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "sold_out" | "specials">("all");

  const hotel = menu.hotel;

  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleSelectCategory = (category: Category) => {
    const catItemIds = category.items.map((i) => i.id);
    const allSelected = catItemIds.length > 0 && catItemIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !catItemIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...catItemIds])));
    }
  };

  const runBulkAction = async (payload: Record<string, any>) => {
    if (selectedItemIds.length === 0) return;
    setBulkLoading(true);
    setBulkMessage(null);
    try {
      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          itemIds: selectedItemIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bulk action failed");
      }

      // Refresh menu state from API so UI reflects exact DB state
      const menuRes = await fetch(`/api/menus/${menu.id}`);
      if (menuRes.ok) {
        const updatedMenu = await menuRes.json();
        setMenu((prev) => ({ ...prev, categories: updatedMenu.categories || prev.categories }));
      }
      setBulkMessage(data.message || "Bulk update completed");
      if (payload.action === "delete") {
        setSelectedItemIds([]);
      }
      router.refresh();
      setTimeout(() => setBulkMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Bulk operation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Category CRUD
  const handleSaveCategory = async (data: { name: string; description: string; imageUrl?: string }) => {
    if (editingCategory) {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setMenu((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === editingCategory.id ? { ...c, ...json.category } : c
          ),
        }));
      }
    } else {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, menuId: menu.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setMenu((prev) => ({
          ...prev,
          categories: [...prev.categories, { ...json.category, items: [] }],
        }));
      }
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure? This will delete all dishes inside this category.")) return;
    const res = await fetch(`/api/categories/${catId}`, { method: "DELETE" });
    if (res.ok) {
      setMenu((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== catId),
      }));
    }
  };

  const handleMoveCategory = async (catIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? catIndex - 1 : catIndex + 1;
    if (targetIndex < 0 || targetIndex >= menu.categories.length) return;

    const newCategories = [...menu.categories];
    const temp = newCategories[catIndex];
    newCategories[catIndex] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    const reordered = newCategories.map((c, idx) => ({ id: c.id, orderIndex: idx + 1 }));
    setMenu((prev) => ({ ...prev, categories: newCategories }));

    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered }),
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setTemplateLoading(templateId);
    try {
      const created: Category[] = [];
      for (const cat of tpl.categories) {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cat.name,
            description: cat.description,
            menuId: menu.id,
          }),
        });
        const json = await res.json();
        if (res.ok && json.category) {
          created.push({ ...json.category, items: [] });
        }
      }
      if (created.length > 0) {
        setMenu((prev) => ({
          ...prev,
          categories: [...prev.categories, ...created],
        }));
      }
    } finally {
      setTemplateLoading(null);
    }
  };

  // Dish CRUD
  const openAddDish = (catId: string) => {
    setTargetCategoryId(catId);
    setEditingItem(null);
    setIsDishModalOpen(true);
  };

  const openEditDish = (item: Item) => {
    setTargetCategoryId(item.categoryId);
    setEditingItem(item);
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (formData: DishFormData) => {
    if (editingItem) {
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (res.ok) {
        setMenu((prev) => ({
          ...prev,
          categories: prev.categories.map((c) => ({
            ...c,
            items: c.items.map((i) => (i.id === editingItem.id ? json.item : i)),
          })),
        }));
      }
    } else {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (res.ok) {
        setMenu((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === formData.categoryId ? { ...c, items: [...c.items, json.item] } : c
          ),
        }));
      }
    }
  };

  const handleQuickAddDish = async (catId: string, e: React.FormEvent) => {
    e.preventDefault();
    const entry = quickAdd[catId] || { name: "", price: "", description: "" };
    const parsedPrice = parseFloat(entry.price);
    if (!entry.name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) return;

    setQuickAdd((prev) => ({
      ...prev,
      [catId]: { ...entry, saving: true },
    }));

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: catId,
          name: entry.name.trim(),
          description: entry.description.trim() || null,
          price: parsedPrice,
          isAvailable: true,
          isChefSpecial: false,
          isFeatured: false,
          dietaryTags: [],
          allergens: [],
        }),
      });
      const json = await res.json();
      if (res.ok && json.item) {
        setMenu((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === catId ? { ...c, items: [...c.items, json.item] } : c
          ),
        }));
        setQuickAdd((prev) => ({
          ...prev,
          [catId]: { name: "", price: "", description: "", saving: false },
        }));
      } else {
        alert(json.error || "Could not quick-add dish");
        setQuickAdd((prev) => ({
          ...prev,
          [catId]: { ...entry, saving: false },
        }));
      }
    } catch {
      alert("Could not quick-add dish");
      setQuickAdd((prev) => ({
        ...prev,
        [catId]: { ...entry, saving: false },
      }));
    }
  };

  const handleDuplicateDish = async (item: Item) => {
    setDuplicatingItemId(item.id);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: item.categoryId,
          name: `${item.name} (Copy)`,
          description: item.description,
          price: item.price,
          discountPrice: item.discountPrice,
          imageUrl: item.imageUrl,
          videoUrl: item.videoUrl,
          isAvailable: item.isAvailable,
          isChefSpecial: item.isChefSpecial,
          isFeatured: item.isFeatured,
          calories: item.calories,
          prepTimeMinutes: item.prepTimeMinutes,
          dietaryTags: item.dietaryTags,
          allergens: item.allergens,
        }),
      });
      const json = await res.json();
      if (res.ok && json.item) {
        setMenu((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === item.categoryId ? { ...c, items: [...c.items, json.item] } : c
          ),
        }));
      }
    } finally {
      setDuplicatingItemId(null);
    }
  };

  const handleSaveInlinePrice = async (item: Item) => {
    const nextPrice = parseFloat(editingPriceValue);
    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      setEditingPriceItemId(null);
      return;
    }
    setEditingPriceItemId(null);
    // Optimistic update
    setMenu((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === item.id ? { ...i, price: nextPrice } : i)),
      })),
    }));

    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        price: nextPrice,
      }),
    });
  };

  const handleDeleteDish = async (itemId: string, catId: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;
    const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setMenu((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        ),
      }));
    }
  };

  const handleToggleAvailability = async (item: Item) => {
    const nextState = !item.isAvailable;
    // Optimistic update
    setMenu((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === item.id ? { ...i, isAvailable: nextState } : i)),
      })),
    }));

    await fetch(`/api/items/${item.id}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: nextState }),
    });
  };

  const handleMoveDish = async (catId: string, itemIndex: number, direction: "up" | "down") => {
    const cat = menu.categories.find((c) => c.id === catId);
    if (!cat) return;

    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= cat.items.length) return;

    const newItems = [...cat.items];
    const temp = newItems[itemIndex];
    newItems[itemIndex] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reordered = newItems.map((it, idx) => ({ id: it.id, orderIndex: idx + 1 }));

    setMenu((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === catId ? { ...c, items: newItems } : c)),
    }));

    await fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered }),
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/menus"
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                {menu.title}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${
                  menu.isPublished
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                {menu.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              /menu/{menu.slug}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/menus/import"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border/80 bg-secondary/40 hover:bg-secondary text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ScanLine className="w-4 h-4 text-gold-400" /> AI Import Menu
          </Link>
          <a
            href={`/menu/${menu.slug}${!menu.isPublished ? "?preview=true" : ""}`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border/80 bg-secondary/40 hover:bg-secondary text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Guest View
          </a>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-px overflow-x-auto no-scrollbar">
        {[
          { id: "dishes", label: "Dishes & Categories", icon: UtensilsCrossed },
          { id: "qr", label: "QR Code Studio", icon: QrCode },
          { id: "settings", label: "Menu Settings", icon: Settings },
          { id: "preview", label: "Live Menu Preview", icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-gold-500 text-gold-400 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Dishes & Categories */}
      {activeTab === "dishes" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-serif text-xl font-medium text-foreground">
                Menu Courses & Culinary Selections
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-light">
                Use the inline Quick-Add bar inside any category for fast entry, click any price to edit inline, or open the full Dish Editor for photos &amp; allergens.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchMediaOpen(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-gold-500/40 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 flex items-center gap-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Batch Match Photos &amp; Videos
              </button>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Course / Category
              </button>
            </div>
          </div>

          {bulkMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bulkMessage}</span>
            </div>
          )}

          {/* Bulk Operations Bar (/api/items/bulk) */}
          {selectedItemIds.length > 0 && (
            <div className="p-4 rounded-2xl bg-card border-2 border-gold-500/50 shadow-elevated space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-gold-500/20 text-gold-400 text-xs font-bold">
                    {selectedItemIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedItemIds([])}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Clear selection
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => runBulkAction({ action: "set_availability", isAvailable: true })}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50"
                  >
                    Mark Available
                  </button>
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => runBulkAction({ action: "set_availability", isAvailable: false })}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-50"
                  >
                    Mark Sold Out (86&apos;d)
                  </button>
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => {
                      if (confirm(`Delete ${selectedItemIds.length} selected dishes permanently?`)) {
                        runBulkAction({ action: "delete" });
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Bulk Move Category */}
                <div className="flex items-center gap-2">
                  <FolderInput className="w-4 h-4 text-muted-foreground shrink-0" />
                  <select
                    aria-label="Target category for bulk move"
                    value={bulkMoveCategoryId}
                    onChange={(e) => setBulkMoveCategoryId(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs text-foreground"
                  >
                    <option value="">Move selected to category…</option>
                    {menu.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={bulkLoading || !bulkMoveCategoryId}
                    onClick={() =>
                      runBulkAction({
                        action: "move_category",
                        targetCategoryId: bulkMoveCategoryId,
                      })
                    }
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-secondary hover:bg-gold-500 hover:text-black border border-border disabled:opacity-40"
                  >
                    Move
                  </button>
                </div>

                {/* Bulk Price Adjustment */}
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Bulk price adjustment mode"
                    value={bulkPriceMode}
                    onChange={(e) => setBulkPriceMode(e.target.value as "percentage" | "fixed")}
                    className="px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs text-foreground"
                  >
                    <option value="percentage">Adjust by %</option>
                    <option value="fixed">Adjust by {hotel.currencySymbol}</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={bulkPriceValue}
                    onChange={(e) => setBulkPriceValue(e.target.value)}
                    placeholder={bulkPriceMode === "percentage" ? "e.g. 10 or -10" : "e.g. 5 or -2.5"}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs text-foreground min-w-0"
                  />
                  <button
                    type="button"
                    disabled={bulkLoading || bulkPriceValue.trim() === "" || Number.isNaN(Number(bulkPriceValue))}
                    onClick={() => {
                      const num = Number(bulkPriceValue);
                      runBulkAction(
                        bulkPriceMode === "percentage"
                          ? { action: "adjust_prices", percentage: num }
                          : { action: "adjust_prices", fixedAmount: num }
                      );
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-secondary hover:bg-gold-500 hover:text-black border border-border disabled:opacity-40 whitespace-nowrap"
                  >
                    Apply Price
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dish Search & Quick Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dishes by name or description..."
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
              />
              {dishSearch && (
                <button
                  type="button"
                  onClick={() => setDishSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "all", label: "All Dishes" },
                  { id: "available", label: "Available" },
                  { id: "sold_out", label: "86'd / Sold Out" },
                  { id: "specials", label: "Chef's Specials" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                    statusFilter === f.id
                      ? "bg-primary text-black border-gold-500 font-bold"
                      : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {menu.categories.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border bg-card/40 space-y-6">
              <div>
                <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                <h4 className="font-serif text-xl font-medium text-foreground">
                  Start Your Menu in One Click
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Choose a starter course template below to pre-build your categories, or create a custom category from scratch.
                </p>
              </div>

              {/* 1-Click Starter Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
                {STARTER_TEMPLATES.map((tpl) => {
                  const isBusy = templateLoading === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      disabled={!!templateLoading}
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className="p-4 rounded-2xl border border-border bg-card hover:border-gold-500/60 hover:bg-secondary/40 transition-all flex flex-col justify-between gap-2 disabled:opacity-50"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif text-sm font-medium text-foreground">
                            {tpl.label}
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.subtitle}</p>
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gold-400">
                        {isBusy ? "Creating courses…" : "Use Template →"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="py-2.5 px-5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-black"
                >
                  Create Custom Category
                </button>
                <Link
                  href="/admin/menus/import"
                  className="py-2.5 px-5 rounded-full text-xs font-semibold uppercase tracking-wider border border-border bg-secondary/50 hover:bg-secondary text-foreground flex items-center gap-1.5"
                >
                  <ScanLine className="w-3.5 h-3.5 text-gold-400" /> Import from Photo / PDF / Text
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {menu.categories.map((category, catIndex) => {
                const filteredItems = category.items.filter((item) => {
                  if (dishSearch.trim()) {
                    const q = dishSearch.toLowerCase();
                    const matchName = item.name.toLowerCase().includes(q);
                    const matchDesc = item.description?.toLowerCase().includes(q);
                    if (!matchName && !matchDesc) return false;
                  }
                  if (statusFilter === "available" && !item.isAvailable) return false;
                  if (statusFilter === "sold_out" && item.isAvailable) return false;
                  if (statusFilter === "specials" && !item.isChefSpecial) return false;
                  return true;
                });

                const allCatSelected =
                  filteredItems.length > 0 &&
                  filteredItems.every((i) => selectedItemIds.includes(i.id));
                const qa = quickAdd[category.id] || { name: "", price: "", description: "", saving: false };

                return (
                <div
                  key={category.id}
                  className="rounded-3xl bg-card border border-border shadow-subtle overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-5 bg-secondary/30 border-b border-border/70 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {category.items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleSelectCategory(category)}
                          className="p-1 text-muted-foreground hover:text-gold-400"
                          title={allCatSelected ? "Deselect all in category" : "Select all in category"}
                          aria-label={allCatSelected ? `Deselect all in ${category.name}` : `Select all in ${category.name}`}
                        >
                          {allCatSelected ? (
                            <CheckSquare className="w-4 h-4 text-gold-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <button
                          onClick={() => handleMoveCategory(catIndex, "up")}
                          disabled={catIndex === 0}
                          className="p-1 hover:text-foreground disabled:opacity-30"
                          title="Move Category Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveCategory(catIndex, "down")}
                          disabled={catIndex === menu.categories.length - 1}
                          className="p-1 hover:text-foreground disabled:opacity-30"
                          title="Move Category Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-lg font-medium text-foreground">
                            {category.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            ({filteredItems.length}
                            {filteredItems.length !== category.items.length
                              ? ` of ${category.items.length}`
                              : ""}
                            )
                          </span>
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground font-light">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddDish(category.id)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Full Dish Editor
                      </button>

                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick-Add Dish Bar */}
                  <form
                    onSubmit={(e) => handleQuickAddDish(category.id, e)}
                    className="px-4 sm:px-6 py-3 bg-secondary/15 border-b border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold-400 shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Quick Add:</span>
                    </div>
                    <input
                      type="text"
                      value={qa.name}
                      onChange={(e) =>
                        setQuickAdd((prev) => ({
                          ...prev,
                          [category.id]: { ...qa, name: e.target.value },
                        }))
                      }
                      placeholder="Dish name (e.g. Truffle Fries)"
                      className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl bg-background/80 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={qa.price}
                      onChange={(e) =>
                        setQuickAdd((prev) => ({
                          ...prev,
                          [category.id]: { ...qa, price: e.target.value },
                        }))
                      }
                      placeholder={`Price (${hotel.currencySymbol})`}
                      className="w-full sm:w-28 px-3 py-1.5 rounded-xl bg-background/80 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                    />
                    <input
                      type="text"
                      value={qa.description}
                      onChange={(e) =>
                        setQuickAdd((prev) => ({
                          ...prev,
                          [category.id]: { ...qa, description: e.target.value },
                        }))
                      }
                      placeholder="Short description (optional)"
                      className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl bg-background/80 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                    />
                    <button
                      type="submit"
                      disabled={qa.saving || !qa.name.trim() || !qa.price.trim()}
                      className="py-1.5 px-3.5 rounded-xl text-xs font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/40 hover:bg-gold-500 hover:text-black transition-colors disabled:opacity-40 shrink-0"
                    >
                      {qa.saving ? "Adding…" : "+ Add"}
                    </button>
                  </form>

                  {/* Dishes inside category */}
                  <div className="p-4 sm:p-6">
                    {category.items.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                        No dishes in this category yet. Type a name and price in the Quick Add bar above and press Enter, or click &quot;Full Dish Editor&quot;.
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                        No dishes in this category match your active search or filter.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredItems.map((item, itemIdx) => {
                          const isSelected = selectedItemIds.includes(item.id);
                          const isEditingPrice = editingPriceItemId === item.id;
                          return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border bg-background/50 hover:border-gold-500/50 transition-all flex flex-col justify-between ${
                              isSelected ? "border-gold-500 ring-1 ring-gold-500/30" : "border-border/80"
                            } ${!item.isAvailable ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleSelectItem(item.id)}
                                className="mt-1 text-muted-foreground hover:text-gold-400 shrink-0"
                                aria-label={`Select ${item.name}`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-gold-500" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                              {item.imageUrl ? (
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/70">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                                  {item.name.charAt(0)}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-serif text-sm font-medium text-foreground truncate">
                                    {item.name}
                                  </h5>
                                  <div className="text-right shrink-0">
                                    {isEditingPrice ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          autoFocus
                                          value={editingPriceValue}
                                          onChange={(e) => setEditingPriceValue(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveInlinePrice(item);
                                            if (e.key === "Escape") setEditingPriceItemId(null);
                                          }}
                                          className="w-20 px-2 py-0.5 rounded-lg bg-secondary border border-gold-500 text-xs text-foreground focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveInlinePrice(item)}
                                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                          title="Save price"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingPriceItemId(null)}
                                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                                          title="Cancel"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPriceItemId(item.id);
                                          setEditingPriceValue(String(item.price));
                                        }}
                                        title="Click to quick-edit price"
                                        className="text-xs font-semibold text-foreground hover:text-gold-400 px-1.5 py-0.5 rounded hover:bg-secondary/60 transition-colors"
                                      >
                                        {formatPrice(
                                          item.discountPrice ?? item.price,
                                          hotel.currency,
                                          hotel.currencySymbol
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {item.description && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 font-light">
                                    {item.description}
                                  </p>
                                )}

                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                  {item.isChefSpecial && (
                                    <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" /> Special
                                    </span>
                                  )}
                                  {item.dietaryTags.slice(0, 2).map((t) => (
                                    <span
                                      key={t}
                                      className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                              {/* Availability Switch */}
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                                  item.isAvailable
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                    : "bg-destructive/10 text-destructive border-destructive/30"
                                }`}
                              >
                                {item.isAvailable ? "Available" : "Sold Out"}
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMoveDish(category.id, itemIdx, "up")}
                                  disabled={itemIdx === 0}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveDish(category.id, itemIdx, "down")}
                                  disabled={itemIdx === category.items.length - 1}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateDish(item)}
                                  disabled={duplicatingItemId === item.id}
                                  className="p-1 text-muted-foreground hover:text-gold-400 disabled:opacity-40"
                                  title="Duplicate Dish"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditDish(item)}
                                  className="p-1 text-muted-foreground hover:text-gold-400"
                                  title="Edit Dish"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDish(item.id, category.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive"
                                  title="Delete Dish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: QR Code Studio */}
      {activeTab === "qr" && (
        <QRStudio
          menuId={menu.id}
          menuTitle={menu.title}
          menuSlug={menu.slug}
          hotelName={hotel.name}
          hotelPrimaryColor={hotel.primaryColor}
        />
      )}

      {/* Tab 3: Menu Settings */}
      {activeTab === "settings" && (
        <MenuSettings
          menu={menu}
          onUpdate={(updated) => setMenu((prev) => ({ ...prev, ...updated }))}
        />
      )}

      {/* Tab 4: Multi-Device & Layout Live Preview Studio */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          {/* Preview Studio Controls Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-subtle flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold block">
                Multi-Device &amp; Layout Preview Studio
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Preview how guests experience your menu across Mobile phones, Table iPads, and Large screens—and test Cards, Grid, Table, Editorial, or Compact views.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Viewport Size Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border">
                {(
                  [
                    { id: "mobile", label: "Phone", icon: Smartphone },
                    { id: "tablet", label: "Tablet / iPad", icon: Tablet },
                    { id: "desktop", label: "Large Screen", icon: Monitor },
                  ] as const
                ).map((dev) => {
                  const Icon = dev.icon;
                  const active = previewDevice === dev.id;
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => setPreviewDevice(dev.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        active
                          ? "bg-primary text-black font-bold shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{dev.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Layout Mode Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: "CARDS", label: "Cards", icon: Rows3 },
                    { id: "GRID", label: "Grid", icon: LayoutGrid },
                    { id: "TABLE", label: "Table", icon: Table2 },
                    { id: "MAGAZINE", label: "Editorial", icon: BookOpen },
                    { id: "LIST", label: "Compact", icon: LayoutList },
                  ] as const
                ).map((lay) => {
                  const Icon = lay.icon;
                  const active = previewLayout === lay.id;
                  return (
                    <button
                      key={lay.id}
                      type="button"
                      onClick={() => setPreviewLayout(lay.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all whitespace-nowrap ${
                        active
                          ? "bg-gold-500/20 text-gold-400 border border-gold-500/40 font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{lay.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Save as Default Layout Button */}
              {previewLayout !== menu.displayLayout && (
                <button
                  type="button"
                  disabled={savingLayout}
                  onClick={async () => {
                    setSavingLayout(true);
                    try {
                      const res = await fetch(`/api/menus/${menu.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: menu.title,
                          slug: menu.slug,
                          description: menu.description,
                          headerImageUrl: menu.headerImageUrl,
                          isPublished: menu.isPublished,
                          displayLayout: previewLayout,
                        }),
                      });
                      if (res.ok) {
                        setMenu((prev) => ({ ...prev, displayLayout: previewLayout as any }));
                        setBulkMessage(`Saved ${previewLayout} as default menu layout!`);
                        setTimeout(() => setBulkMessage(null), 3500);
                      }
                    } finally {
                      setSavingLayout(false);
                    }
                  }}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
                >
                  {savingLayout ? "Saving…" : `Set ${previewLayout} as Default`}
                </button>
              )}

              <a
                href={`/menu/${menu.slug}?preview=true&layout=${previewLayout}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3.5 rounded-xl text-xs font-semibold border border-border bg-secondary/50 hover:bg-secondary text-foreground flex items-center gap-1.5 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Tab
              </a>
            </div>
          </div>

          {/* Device Viewport Frame */}
          <div className="flex flex-col items-center justify-center">
            {previewDevice === "mobile" ? (
              <div className="relative w-[390px] max-w-full h-[760px] rounded-[48px] bg-black p-3.5 border-4 border-neutral-700 shadow-2xl transition-all duration-300">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-neutral-800" />
                </div>
                <div className="w-full h-full rounded-[38px] overflow-hidden bg-background relative z-10 border border-neutral-800">
                  <iframe
                    key={`${menu.slug}-${previewLayout}-mobile`}
                    src={`/menu/${menu.slug}?preview=true&layout=${previewLayout}`}
                    className="w-full h-full border-0"
                    title="Mobile menu preview simulation"
                  />
                </div>
              </div>
            ) : previewDevice === "tablet" ? (
              <div className="relative w-full max-w-[860px] h-[800px] rounded-[36px] bg-black p-4 border-4 border-neutral-700 shadow-2xl transition-all duration-300">
                <div className="w-full h-full rounded-[24px] overflow-hidden bg-background relative z-10 border border-neutral-800">
                  <iframe
                    key={`${menu.slug}-${previewLayout}-tablet`}
                    src={`/menu/${menu.slug}?preview=true&layout=${previewLayout}`}
                    className="w-full h-full border-0"
                    title="Tablet menu preview simulation"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-[840px] rounded-3xl bg-black p-2.5 border-2 border-neutral-700 shadow-2xl transition-all duration-300">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-background border border-neutral-800">
                  <iframe
                    key={`${menu.slug}-${previewLayout}-desktop`}
                    src={`/menu/${menu.slug}?preview=true&layout=${previewLayout}`}
                    className="w-full h-full border-0"
                    title="Large screen menu preview simulation"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialData={editingCategory}
      />

      {/* Dish Modal */}
      <DishModal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        onSave={handleSaveDish}
        categoryId={targetCategoryId}
        categories={menu.categories.map((c) => ({ id: c.id, name: c.name }))}
        initialData={editingItem}
        currencySymbol={hotel.currencySymbol}
      />

      {/* Smart Batch Photo & Video Matcher Modal */}
      <BatchMediaModal
        isOpen={isBatchMediaOpen}
        onClose={() => setIsBatchMediaOpen(false)}
        dishes={menu.categories.flatMap((c) =>
          c.items.map((item) => ({
            id: item.id,
            name: item.name,
            categoryName: c.name,
          }))
        )}
        onApplyRemote={async (assignments: RemoteMediaAssignment[]) => {
          const itemIds = assignments.map((a) => a.itemId);
          const res = await fetch("/api/items/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "batch_assign_media",
              itemIds,
              assignments,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to save matched media");
          }

          // Optimistically update local menu state
          const byItem = new Map(assignments.map((a) => [a.itemId, a]));
          setMenu((prev) => ({
            ...prev,
            categories: prev.categories.map((cat) => ({
              ...cat,
              items: cat.items.map((it) => {
                const match = byItem.get(it.id);
                if (!match) return it;
                return {
                  ...it,
                  imageUrl:
                    match.imageUrl !== undefined ? match.imageUrl : it.imageUrl,
                  videoUrl:
                    match.videoUrl !== undefined ? match.videoUrl : it.videoUrl,
                };
              }),
            })),
          }));

          setBulkMessage(
            data.message ||
              `Assigned matched photos/videos to ${assignments.length} dishes`
          );
          router.refresh();
          setTimeout(() => setBulkMessage(null), 5000);
        }}
      />
    </div>
  );
}

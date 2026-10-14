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
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CategoryModal } from "./category-modal";
import { DishModal, DishFormData } from "./dish-modal";
import { QRStudio } from "./qr-studio";
import { MenuSettings } from "./menu-settings";
import { DIETARY_OPTIONS } from "@/config/theme";

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
  displayLayout: "GRID" | "LIST" | "CARDS" | "MAGAZINE";
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

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const hotel = menu.hotel;

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
          { id: "preview", label: "Mobile Simulator", icon: Smartphone },
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
                Add courses, adjust prices, toggle daily availability, and drag or reorder dishes.
              </p>
            </div>

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

          {menu.categories.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/40">
              <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h4 className="font-serif text-lg font-medium text-foreground">
                No Categories Created Yet
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Begin organizing your menu by adding courses like Appetizers, Main Entrées, Desserts, or Fine Wines.
              </p>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="mt-4 py-2 px-5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-black"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {menu.categories.map((category, catIndex) => (
                <div
                  key={category.id}
                  className="rounded-3xl bg-card border border-border shadow-subtle overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-5 bg-secondary/30 border-b border-border/70 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
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
                        <h4 className="font-serif text-lg font-medium text-foreground">
                          {category.name}
                        </h4>
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
                        <Plus className="w-3.5 h-3.5" /> Add Dish
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

                  {/* Dishes inside category */}
                  <div className="p-4 sm:p-6">
                    {category.items.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                        No dishes in this category. Click &quot;Add Dish&quot; above to add your first item.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.items.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border border-border/80 bg-background/50 hover:border-gold-500/50 transition-all flex flex-col justify-between ${
                              !item.isAvailable ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
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
                                    <span className="text-xs font-semibold text-foreground">
                                      {formatPrice(
                                        item.discountPrice ?? item.price,
                                        hotel.currency,
                                        hotel.currencySymbol
                                      )}
                                    </span>
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

      {/* Tab 4: Mobile Simulator Preview */}
      {activeTab === "preview" && (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold block">
              Real-Time Table View Simulation
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Test mobile interactions, responsive layouts, search, and category navigation.
            </p>
          </div>

          {/* Smartphone device shell */}
          <div className="relative w-[380px] h-[740px] rounded-[48px] bg-black p-3.5 border-4 border-neutral-700 shadow-2xl">
            {/* Top notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-neutral-800" />
            </div>

            {/* Screen Frame */}
            <div className="w-full h-full rounded-[38px] overflow-hidden bg-background relative z-10 border border-neutral-800">
              <iframe
                src={`/menu/${menu.slug}?preview=true`}
                className="w-full h-full border-0"
                title="Mobile menu preview simulation"
              />
            </div>
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
        initialData={editingItem}
        currencySymbol={hotel.currencySymbol}
      />
    </div>
  );
}

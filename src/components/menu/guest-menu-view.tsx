"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Share2,
  Sparkles,
  LayoutGrid,
  List,
  Columns2,
  MapPin,
  Phone,
  Globe,
  Star,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GuestCategoryTabs } from "./guest-category-tabs";
import { GuestItemCard, MenuItemData } from "./guest-item-card";
import { GuestItemModal } from "./guest-item-modal";
import { GuestShareModal } from "./guest-share-modal";
import { DIETARY_OPTIONS } from "@/config/theme";

interface CategoryData {
  id: string;
  name: string;
  description?: string | null;
  orderIndex: number;
  items: MenuItemData[];
}

interface HotelData {
  id: string;
  name: string;
  tagline?: string | null;
  starRating?: number | null;
  phone?: string | null;
  email: string;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  primaryColor?: string | null;
  fontFamily?: string | null;
  currency: string;
  currencySymbol: string;
}

interface MenuData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  headerImageUrl?: string | null;
  displayLayout: "GRID" | "LIST" | "CARDS" | "MAGAZINE";
  qrCodeSvg?: string | null;
  hotel: HotelData;
  categories: CategoryData[];
}

interface GuestMenuViewProps {
  menu: MenuData;
  isPreview?: boolean;
}

export function GuestMenuView({ menu, isPreview = false }: GuestMenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [onlyChefSpecials, setOnlyChefSpecials] = useState(false);
  const [layout, setLayout] = useState<"GRID" | "LIST" | "CARDS">("GRID");
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const hotel = menu.hotel;
  const primaryColor = hotel.primaryColor || "#B89334";

  // Initial layout preference from menu data
  useEffect(() => {
    if (menu.displayLayout === "LIST") setLayout("LIST");
    else if (menu.displayLayout === "CARDS") setLayout("CARDS");
    else setLayout("GRID");
  }, [menu.displayLayout]);

  // Analytics event recording
  useEffect(() => {
    if (!isPreview) {
      const urlParams = new URLSearchParams(window.location.search);
      const isQr = urlParams.get("source") === "qr" || urlParams.get("qr") === "true";
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuSlug: menu.slug,
          type: isQr ? "QR_SCAN" : "PAGE_VIEW",
        }),
      }).catch(() => {});
    }
  }, [menu.slug, isPreview]);

  // Prepare category tabs data
  const categoryTabs = useMemo(() => {
    return menu.categories.map((c) => ({
      id: c.id,
      name: c.name,
      count: c.items.length,
    }));
  }, [menu.categories]);

  // Filter items
  const filteredCategories = useMemo(() => {
    return menu.categories
      .map((cat) => {
        if (activeCategory !== "all" && cat.id !== activeCategory) {
          return null;
        }

        const matchingItems = cat.items.filter((item) => {
          // Search query match
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchName = item.name.toLowerCase().includes(query);
            const matchDesc = item.description?.toLowerCase().includes(query);
            if (!matchName && !matchDesc) return false;
          }

          // Dietary tags match (must match all selected tags)
          if (selectedDietary.length > 0) {
            const hasAllTags = selectedDietary.every((tag) =>
              item.dietaryTags.includes(tag)
            );
            if (!hasAllTags) return false;
          }

          // Chef special filter
          if (onlyChefSpecials && !item.isChefSpecial) {
            return false;
          }

          return true;
        });

        if (matchingItems.length === 0) return null;

        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter(Boolean) as CategoryData[];
  }, [menu.categories, activeCategory, searchQuery, selectedDietary, onlyChefSpecials]);

  const totalFilteredItems = filteredCategories.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );

  const toggleDietaryTag = (tag: string) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedDietary([]);
    setOnlyChefSpecials(false);
    setActiveCategory("all");
  };

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-colors ${
        hotel.fontFamily === "sans" ? "font-sans" : "font-serif"
      }`}
      style={{ "--hotel-primary": primaryColor } as React.CSSProperties}
    >
      {/* Top Floating Utility Bar */}
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2">
        {isPreview && (
          <span className="px-3 py-1 rounded-full bg-amber-500/90 text-black text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-md">
            Preview Mode
          </span>
        )}
        <button
          onClick={() => setIsShareOpen(true)}
          className="p-2.5 rounded-full bg-card/80 hover:bg-card text-foreground border border-border/80 shadow-subtle backdrop-blur-md transition-all hover:scale-105"
          title="Share Menu & QR Code"
          aria-label="Share Menu"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <ThemeToggle className="bg-card/80 hover:bg-card shadow-subtle backdrop-blur-md" />
      </div>

      {/* Hotel Hero Banner */}
      <div className="relative w-full h-72 sm:h-96 overflow-hidden bg-black">
        {hotel.coverImageUrl || menu.headerImageUrl ? (
          <Image
            src={menu.headerImageUrl || hotel.coverImageUrl || ""}
            alt={hotel.name}
            fill
            className="object-cover opacity-60 scale-105 animate-fadeIn"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-stone-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />

        {/* Hero Branding Info */}
        <div className="absolute bottom-6 left-0 right-0 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-4">
            {hotel.logoUrl && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/20 bg-black/40 backdrop-blur-md shrink-0 shadow-lg">
                <Image
                  src={hotel.logoUrl}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold font-sans">
                  {hotel.name}
                </span>
                {hotel.starRating && (
                  <div className="flex items-center gap-0.5 text-gold-400">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white drop-shadow-md">
                {menu.title}
              </h1>

              {menu.description && (
                <p className="mt-1.5 text-xs sm:text-sm text-white/80 max-w-2xl font-light font-sans line-clamp-2">
                  {menu.description}
                </p>
              )}
            </div>
          </div>

          {/* Hotel Location / Phone links */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-xs text-white/70 font-sans flex-wrap">
            {(hotel.city || hotel.country) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gold-400" />
                {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ")}
              </span>
            )}
            {hotel.phone && (
              <a
                href={`tel:${hotel.phone}`}
                className="inline-flex items-center gap-1 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3 text-gold-400" /> {hotel.phone}
              </a>
            )}
            {hotel.website && (
              <a
                href={hotel.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-white transition-colors"
              >
                <Globe className="w-3 h-3 text-gold-400" /> Concierge Web
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      <GuestCategoryTabs
        categories={categoryTabs}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        primaryColor={primaryColor}
      />

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans">
        {/* Search, Filter Chips & Layout Toggle */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search dishes, ingredients, wine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-secondary/60 hover:bg-secondary focus:bg-card border border-border/70 focus:border-gold-500/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Layout switchers */}
            <div className="flex items-center justify-end gap-1 p-1 bg-secondary/60 rounded-xl border border-border/60 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setLayout("GRID")}
                className={`p-1.5 rounded-lg transition-colors ${
                  layout === "GRID" ? "bg-card text-gold-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid layout"
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("CARDS")}
                className={`p-1.5 rounded-lg transition-colors ${
                  layout === "CARDS" ? "bg-card text-gold-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Cards layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("LIST")}
                className={`p-1.5 rounded-lg transition-colors ${
                  layout === "LIST" ? "bg-card text-gold-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Minimalist list layout"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setOnlyChefSpecials(!onlyChefSpecials)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                onlyChefSpecials
                  ? "bg-gold-500 text-black border-gold-500 font-semibold shadow-sm"
                  : "bg-secondary/50 text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3 h-3" /> Chef&apos;s Specials
            </button>

            {DIETARY_OPTIONS.map((tag) => {
              const isSelected = selectedDietary.includes(tag.value);
              return (
                <button
                  key={tag.value}
                  onClick={() => toggleDietaryTag(tag.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-secondary/50 text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}

            {(searchQuery || selectedDietary.length > 0 || onlyChefSpecials) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-destructive hover:bg-destructive/10 whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Empty Search / Filter State */}
        {filteredCategories.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border bg-card/40 p-8">
            <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-xl font-medium text-foreground">
              No Culinary Selections Found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              We couldn&apos;t find any items matching your active filters. Try adjusting your search query or dietary preferences.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-5 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-90 transition-opacity"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Category Sections */
          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-24 space-y-4"
              >
                {/* Category Header */}
                <div className="border-b border-border/60 pb-3">
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground flex items-center justify-between">
                    <span>{category.name}</span>
                    <span className="text-xs font-sans text-muted-foreground font-normal">
                      {category.items.length} items
                    </span>
                  </h3>
                  {category.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Items Grid/List */}
                <div
                  className={`grid gap-4 sm:gap-6 ${
                    layout === "GRID"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : layout === "CARDS"
                      ? "grid-cols-1"
                      : "grid-cols-1"
                  }`}
                >
                  {category.items.map((item) => (
                    <GuestItemCard
                      key={item.id}
                      item={item}
                      layout={layout}
                      currency={hotel.currency}
                      currencySymbol={hotel.currencySymbol}
                      onOpenDetail={setSelectedItem}
                      primaryColor={primaryColor}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-10 pb-16 border-t border-border/60 text-center font-sans">
          <div className="max-w-md mx-auto space-y-3">
            <h4 className="font-serif text-lg font-medium text-foreground">{hotel.name}</h4>
            {hotel.tagline && (
              <p className="text-xs text-muted-foreground font-light">{hotel.tagline}</p>
            )}
            <p className="text-[11px] text-muted-foreground/70">
              Prices include all applicable local hospitality taxes. Please inform your server of any dietary requirements or food allergies before ordering.
            </p>
            <div className="pt-2 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Powered by LuxMenu Digital Hospitality
            </div>
          </div>
        </footer>
      </main>

      {/* Item Detail Modal */}
      <GuestItemModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        currency={hotel.currency}
        currencySymbol={hotel.currencySymbol}
        primaryColor={primaryColor}
      />

      {/* Share / QR Modal */}
      <GuestShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        menuTitle={menu.title}
        hotelName={hotel.name}
        menuSlug={menu.slug}
        qrCodeSvg={menu.qrCodeSvg}
      />
    </div>
  );
}

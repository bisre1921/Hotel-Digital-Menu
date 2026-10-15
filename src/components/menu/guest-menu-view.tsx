"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Flame, Share2, Search, SlidersHorizontal, MapPin, Phone, Globe, X, Utensils } from "lucide-react";
import { GuestItemCard, type MenuItemData } from "./guest-item-card";
import { GuestItemModal } from "./guest-item-modal";
import { GuestShareModal } from "./guest-share-modal";
import { DIETARY_OPTIONS } from "@/config/theme";
import styles from "./guest-menu.module.css";

interface CategoryData {
  id: string;
  name: string;
  description?: string | null;
  orderIndex: number;
  items: MenuItemData[];
}
interface HotelData {
  id: string; name: string; tagline?: string | null; phone?: string | null;
  website?: string | null; address?: string | null; city?: string | null;
  country?: string | null; logoUrl?: string | null; currency: string; currencySymbol: string;
}
interface MenuData {
  id: string; title: string; slug: string; description?: string | null;
  qrCodeSvg?: string | null; hotel: HotelData; categories: CategoryData[];
}

export function GuestMenuView({ menu, isPreview = false, previewLabel = "Draft preview · Only visible to your business", walkthroughStage }: { menu: MenuData; isPreview?: boolean; previewLabel?: string; walkthroughStage?: "details" | "reviews" }) {
  const [ratings, setRatings] = useState<Record<string, { ratingAverage: number | null; reviewCount: number }>>({});
  const updateRating = useCallback((id: string, average: number | null, count: number) => { setRatings((current) => ({ ...current, [id]: { ratingAverage: average, reviewCount: count } })); }, []);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [specialsOnly, setSpecialsOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<(MenuItemData & { categoryName: string }) | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    if (!isPreview || !walkthroughStage) return;
    const category = menu.categories.find(c => c.items.length);
    if (category) setSelectedItem({ ...category.items[0], categoryName: category.name });
  }, [isPreview, walkthroughStage, menu.categories]);
  const hotel = menu.hotel;
  const words = hotel.name.trim().split(/\s+/);
  const accentWord = words.pop();
  const hasFilters = Boolean(searchQuery || dietary.length || specialsOnly);

  useEffect(() => {
    if (isPreview) return;
    const query = new URLSearchParams(window.location.search);
    fetch("/api/analytics", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuSlug: menu.slug, type: query.get("source") === "qr" || query.get("qr") === "true" ? "QR_SCAN" : "PAGE_VIEW" }),
    }).catch(() => {});
  }, [menu.slug, isPreview]);

  const items = useMemo(() => menu.categories.flatMap((category) =>
    (activeCategory === "all" || category.id === activeCategory ? category.items : [])
      .filter((item) => (!searchQuery.trim() || `${item.name} ${item.description || ""}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        && dietary.every((tag) => item.dietaryTags.includes(tag)) && (!specialsOnly || item.isChefSpecial))
      .map((item) => ({ ...item, categoryName: category.name }))),
  [menu.categories, activeCategory, searchQuery, dietary, specialsOnly]);

  useEffect(() => { setPage(1); }, [activeCategory, searchQuery, dietary, specialsOnly]);
  const pages = Math.max(1, Math.ceil(items.length / 5));
  const currentPage = Math.min(page, pages);
  function changePage(value: number) {
    setPage(value);
    document.getElementById("menu-list")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function resetFilters() { setSearchQuery(""); setDietary([]); setSpecialsOnly(false); setActiveCategory("all"); }

  return <div className={styles.shell}>
    <div className={styles.column}>
      {isPreview && <div className={styles.preview}>{previewLabel}</div>}
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.brand}>
            {hotel.logoUrl ? <div className={styles.logo}><Image src={hotel.logoUrl} alt="" fill sizes="36px" unoptimized className={styles.cover} /></div> : <Flame className={styles.flame} size={26} aria-hidden="true" />}
            <div className={styles.brandText}>
              <h1>{words.join(" ")}{words.length ? " " : ""}<span>{accentWord}</span></h1>
              <p>{hotel.tagline || menu.title}</p>
            </div>
          </div>
          <div className={styles.tools}>
            <button type="button" aria-label="Search and filter menu" aria-expanded={filtersOpen} aria-controls="menu-filters" onClick={() => setFiltersOpen(!filtersOpen)} className={`${styles.iconButton} ${hasFilters ? styles.toolActive : ""}`}><SlidersHorizontal size={16} /></button>
            <button type="button" aria-label="Share menu" onClick={() => setShareOpen(true)} className={styles.iconButton}><Share2 size={16} /></button>
          </div>
        </div>
        <nav className={styles.categories} aria-label="Menu categories">
          <button type="button" aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")}>All Menu</button>
          {menu.categories.map((category) => <button key={category.id} type="button" aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}
        </nav>
        {filtersOpen && <div id="menu-filters" className={styles.filters}>
          <label className={styles.search}><Search size={16} /><input aria-label="Search menu" placeholder="Find a dish…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />{searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")}><X size={16} /></button>}</label>
          <div className={styles.filterTags}>
            <button type="button" aria-pressed={specialsOnly} onClick={() => setSpecialsOnly(!specialsOnly)}>Chef’s specials</button>
            {DIETARY_OPTIONS.map((tag) => <button key={tag.value} type="button" aria-pressed={dietary.includes(tag.value)} onClick={() => setDietary((current) => current.includes(tag.value) ? current.filter((value) => value !== tag.value) : [...current, tag.value])}>{tag.label}</button>)}
          </div>
        </div>}
      </header>
      <main className={styles.menu} id="menu-list">
        <div className={styles.menuCaption}><span>{menu.title}</span><span role="status">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
        {items.length ? items.slice((currentPage - 1) * 5, currentPage * 5).map((item) => <GuestItemCard key={item.id} item={{ ...item, ...ratings[item.id] }} categoryName={item.categoryName} layout="LIST" currency={hotel.currency} currencySymbol={hotel.currencySymbol} onOpenDetail={() => setSelectedItem(item)} />) : <div className={styles.empty}>
          <Utensils size={28} /><h2>{hasFilters ? "Nothing found this time" : "Something good is on its way"}</h2>
          <p>{hasFilters ? "Try a different dish or clear your filters." : "The team is preparing this menu. Please check back soon."}</p>
          {(hasFilters || activeCategory !== "all") && <button type="button" onClick={resetFilters}>Show all menu</button>}
        </div>}
        {pages > 1 && <nav className={styles.menuPages} aria-label="Menu pages"><button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages}</span><button type="button" disabled={currentPage === pages} onClick={() => changePage(currentPage + 1)}>Next</button></nav>}
      </main>
      <footer className={styles.footer}>
        <div className={styles.contact}>
          {hotel.phone && <a href={`tel:${hotel.phone.replace(/[^+\d]/g, "")}`}><Phone size={13} />{hotel.phone}</a>}
          {hotel.website && /^https?:\/\//i.test(hotel.website) && <a href={hotel.website} target="_blank" rel="noreferrer"><Globe size={13} />Website</a>}
        </div>
        {(hotel.address || hotel.city || hotel.country) && <p className={styles.location}><MapPin size={13} />{[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ")}</p>}
        <p className={styles.allergyNote}>Food allergies? Please speak to the team before ordering.</p>
        <p className={styles.powered}>Made for good food. Powered by LuxMenu.</p>
      </footer>
    </div>
    <GuestItemModal initialSection={walkthroughStage === "reviews" ? "reviews" : undefined} onRatingUpdate={updateRating} isPreview={isPreview} item={selectedItem} categoryName={selectedItem?.categoryName} onClose={() => setSelectedItem(null)} currency={hotel.currency} currencySymbol={hotel.currencySymbol} />
    <GuestShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} menuTitle={menu.title} hotelName={hotel.name} menuSlug={menu.slug} menuId={menu.id} qrCodeSvg={menu.qrCodeSvg} />
  </div>;
}

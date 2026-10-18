"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Flame,
  Share2,
  Search,
  SlidersHorizontal,
  MapPin,
  Phone,
  Globe,
  X,
  Utensils,
  Leaf,
  Wallet,
  Sparkles,
  Clock,
  Star,
  Play,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowUp,
} from "lucide-react";
import {
  GuestItemCard,
  type GuestLayoutMode,
  type MenuItemData,
} from "./guest-item-card";
import { GuestItemModal } from "./guest-item-modal";
import { GuestShareModal } from "./guest-share-modal";
import { DIETARY_OPTIONS } from "@/config/theme";
import { formatPrice } from "@/lib/utils";
import {
  type GuestLanguage,
  buildBudgetMealCombos,
  isFastingFriendly,
  normalizeItemVariants,
  resolveLocalizedText,
} from "@/lib/menu-helpers";
import styles from "./guest-menu.module.css";

interface CategoryData {
  id: string;
  name: string;
  nameAm?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  imageUrl?: string | null;
  orderIndex: number;
  items: MenuItemData[];
}
interface HotelData {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  primaryColor?: string | null;
  currency: string;
  currencySymbol: string;
}
interface MenuData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  headerImageUrl?: string | null;
  displayLayout?: "GRID" | "LIST" | "CARDS" | "MAGAZINE" | "TABLE";
  qrCodeSvg?: string | null;
  hotel: HotelData;
  categories: CategoryData[];
}

const ITEMS_PER_PAGE = 8;

const CURATED_MEAL_PLATES: Array<{ keywords: RegExp; url: string }> = [
  {
    keywords: /fried\s*rice|check\s*check|jollof|biryani|pilaf|risotto/i,
    url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /assorted\s*rice|grilled\s*chicken|chicken\s*rice|roast\s*chicken/i,
    url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /plain\s*rice|white\s*rice|rice.*sauce|curry\s*rice/i,
    url: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /yam\s*chips|french\s*fries|fries|chips|potato|wedge/i,
    url: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /noodle|ramen|chow\s*mein|lo\s*mein|stir\s*fry|indomie/i,
    url: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /spaghetti|pasta|macaroni|penne|fettuccine|lasagna/i,
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /shawarma|wrap|kebab|gyro|burrito|taco/i,
    url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /croissant|sandwich|panini|club|toast|brioche/i,
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /omelet|omelette|scrambled\s*egg|fried\s*egg|poached\s*egg|egg/i,
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /tuna\s*salad|nicoise|seafood\s*salad/i,
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /mixed\s*salad|green\s*salad|caesar|greek\s*salad|salad/i,
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /beyaynetu|injera|traditional|mahberawi|fasting\s*platter/i,
    url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /shiro|lentil|misir|kik|stew|wat|wot/i,
    url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /firfir|quanta|chechebsa|kita/i,
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /foul|ful|beans/i,
    url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /tibs|steak|ribeye|wagyu|beef|lamb|pork|meat|grill|bbq/i,
    url: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /wing|drumstick|chicken|poultry/i,
    url: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /fish|salmon|turbot|scallop|shrimp|tempura|seafood|crudo/i,
    url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /mango|orange|pineapple|papaya|passion|citrus/i,
    url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /strawberry|berry|watermelon|punch|hibiscus/i,
    url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /avocado|detox|green|cucumber|lemon|mint|mojito/i,
    url: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /smoothie|booster|muscle|banana|milkshake|shake|peanut/i,
    url: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /coffee|espresso|macchiato|latte|cappuccino|yirgachefe|limu|tea/i,
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /water|ambo|sparkling|soda|soft\s*drink|cola|sprite|fanta/i,
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /burger|slider/i,
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /pizza|flatbread/i,
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: /dessert|cake|chocolate|mille-feuille|pastry|ice\s*cream/i,
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
  },
];

const FALLBACK_PLATES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
];

function resolveMealPlateImage(
  item: MenuItemData,
  categoryName: string,
  categoryImageUrl: string | null | undefined,
  index: number
): string {
  if (item.imageUrl) return item.imageUrl;
  const itemText = `${item.name} ${item.description || ""} ${categoryName}`;
  for (const entry of CURATED_MEAL_PLATES) {
    if (entry.keywords.test(itemText)) {
      return entry.url;
    }
  }
  if (categoryImageUrl) return categoryImageUrl;
  return FALLBACK_PLATES[index % FALLBACK_PLATES.length];
}

export function GuestMenuView({
  menu,
  isPreview = false,
  previewLabel = "Draft preview · Only visible to your business",
  walkthroughStage,
}: {
  menu: MenuData;
  isPreview?: boolean;
  previewLabel?: string;
  walkthroughStage?: "details" | "reviews";
}) {
  const [ratings, setRatings] = useState<
    Record<string, { ratingAverage: number | null; reviewCount: number }>
  >({});
  const updateRating = useCallback(
    (id: string, average: number | null, count: number) => {
      setRatings((current) => ({
        ...current,
        [id]: { ratingAverage: average, reviewCount: count },
      }));
    },
    []
  );
  const [lang, setLang] = useState<GuestLanguage>("en");
  const [viewMode, setViewMode] = useState<GuestLayoutMode>(
    menu.displayLayout || "CARDS"
  );
  const [page, setPage] = useState(1);
  const [browseMode, setBrowseMode] = useState<"scroll" | "pages">("scroll");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dietary, setDietary] = useState<string[]>([]);
  const [fastingOnly, setFastingOnly] = useState(false);
  const [specialsOnly, setSpecialsOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState("500");
  const [selectedItem, setSelectedItem] = useState<
    (MenuItemData & { categoryName: string }) | null
  >(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("luxmenu_guest_lang");
      if (saved === "am" || saved === "en") setLang(saved);
      const params = new URLSearchParams(window.location.search);
      const layoutParam = params.get("layout")?.toUpperCase();
      if (
        layoutParam === "CARDS" ||
        layoutParam === "GRID" ||
        layoutParam === "LIST" ||
        layoutParam === "MAGAZINE" ||
        layoutParam === "TABLE"
      ) {
        setViewMode(layoutParam);
      } else if (menu.displayLayout) {
        setViewMode(menu.displayLayout);
      }
    } catch {}
  }, [menu.displayLayout]);

  const toggleLanguage = () => {
    const next: GuestLanguage = lang === "en" ? "am" : "en";
    setLang(next);
    try {
      window.localStorage.setItem("luxmenu_guest_lang", next);
    } catch {}
  };

  useEffect(() => {
    if (!isPreview || !walkthroughStage) return;
    const category = menu.categories.find((c) => c.items.length);
    if (category)
      setSelectedItem({ ...category.items[0], categoryName: category.name });
  }, [isPreview, walkthroughStage, menu.categories]);

  const hotel = menu.hotel;
  const words = hotel.name.trim().split(/\s+/);
  const accentWord = words.pop();
  const hasFilters = Boolean(
    searchQuery || dietary.length || specialsOnly || fastingOnly
  );
  const bannerImage = menu.headerImageUrl || hotel.coverImageUrl || null;

  useEffect(() => {
    if (isPreview) return;
    const query = new URLSearchParams(window.location.search);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuSlug: menu.slug,
        type:
          query.get("source") === "qr" || query.get("qr") === "true"
            ? "QR_SCAN"
            : "PAGE_VIEW",
      }),
    }).catch(() => {});
  }, [menu.slug, isPreview]);

  const filteredCategories = useMemo(() => {
    return menu.categories
      .filter((category) => activeCategory === "all" || category.id === activeCategory)
      .map((category) => {
        const localizedCatName = resolveLocalizedText(
          category.name,
          category.nameAm,
          lang
        );
        const localizedCatDesc = resolveLocalizedText(
          category.description,
          category.descriptionAm,
          lang
        );
        const matchingItems = category.items
          .filter((item) => {
            const searchable = `${item.name} ${item.nameAm || ""} ${
              item.description || ""
            } ${item.descriptionAm || ""}`.toLowerCase();
            const matchesSearch =
              !searchQuery.trim() ||
              searchable.includes(searchQuery.trim().toLowerCase());
            const matchesDietary = dietary.every((tag) =>
              tag === "FASTING"
                ? isFastingFriendly(item)
                : item.dietaryTags.includes(tag)
            );
            const matchesFasting = !fastingOnly || isFastingFriendly(item);
            const matchesSpecials = !specialsOnly || item.isChefSpecial;
            return (
              matchesSearch &&
              matchesDietary &&
              matchesFasting &&
              matchesSpecials
            );
          })
          .map((item) => ({ ...item, categoryName: localizedCatName }));

        return {
          ...category,
          localizedName: localizedCatName,
          localizedDescription: localizedCatDesc,
          matchingItems,
        };
      })
      .filter((cat) => cat.matchingItems.length > 0);
  }, [
    menu.categories,
    activeCategory,
    searchQuery,
    dietary,
    fastingOnly,
    specialsOnly,
    lang,
  ]);

  const items = useMemo(
    () => filteredCategories.flatMap((cat) => cat.matchingItems),
    [filteredCategories]
  );

  const budgetCombos = useMemo(() => {
    const numericBudget = parseFloat(budgetInput);
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) return [];
    return buildBudgetMealCombos(menu.categories, numericBudget, {
      fastingOnly,
      maxResults: 8,
    });
  }, [menu.categories, budgetInput, fastingOnly]);

  const itemLookup = useMemo(() => {
    const map = new Map<string, MenuItemData & { categoryName: string }>();
    for (const cat of menu.categories) {
      const catLabel = resolveLocalizedText(cat.name, cat.nameAm, lang);
      for (const item of cat.items) {
        map.set(item.id, { ...item, categoryName: catLabel });
      }
    }
    return map;
  }, [menu.categories, lang]);

  const totalMenuCount = useMemo(
    () => menu.categories.reduce((acc, cat) => acc + cat.items.length, 0),
    [menu.categories]
  );

  useEffect(() => {
    setPage(1);
    setVisibleCount(ITEMS_PER_PAGE);
    setBrowseMode("scroll");
  }, [activeCategory, searchQuery, dietary, fastingOnly, specialsOnly, viewMode]);

  const pages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, pages);
  const paginatedItems = useMemo(
    () =>
      items.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [items, currentPage]
  );

  const activeItems = useMemo(
    () =>
      browseMode === "pages"
        ? paginatedItems
        : items.slice(0, Math.min(visibleCount, items.length)),
    [browseMode, paginatedItems, items, visibleCount]
  );

  const visibleCategories = useMemo(() => {
    const allowedIds = new Set(activeItems.map((i) => i.id));
    return filteredCategories
      .map((cat) => ({
        ...cat,
        totalCategoryCount: cat.matchingItems.length,
        matchingItems: cat.matchingItems.filter((item) =>
          allowedIds.has(item.id)
        ),
      }))
      .filter((cat) => cat.matchingItems.length > 0);
  }, [filteredCategories, activeItems]);

  const hasMoreScrollItems =
    browseMode === "scroll" && visibleCount < items.length;

  useEffect(() => {
    if (!hasMoreScrollItems) return;
    const node = loadMoreRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, items.length));
        }
      },
      { rootMargin: "220px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreScrollItems, items.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function changePage(value: number) {
    const target = Math.max(1, Math.min(value, pages));
    setBrowseMode("pages");
    setPage(target);
    setVisibleCount(target * ITEMS_PER_PAGE);
    document
      .getElementById("menu-list")
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function loadMoreItems() {
    setBrowseMode("scroll");
    setVisibleCount((prev) => {
      const next = Math.min(prev + ITEMS_PER_PAGE, items.length);
      setPage(Math.max(1, Math.ceil(next / ITEMS_PER_PAGE)));
      return next;
    });
  }

  function resetFilters() {
    setSearchQuery("");
    setDietary([]);
    setFastingOnly(false);
    setSpecialsOnly(false);
    setActiveCategory("all");
  }

  const shownCount = activeItems.length;
  const progressPercent =
    items.length > 0 ? Math.min(100, Math.round((shownCount / items.length) * 100)) : 100;

  const renderTableRows = (
    rowItems: Array<MenuItemData & { categoryName: string }>
  ) => (
    <div className={styles.tableWrap}>
      <table className={styles.menuTable}>
        <thead>
          <tr>
            <th>{lang === "am" ? "ምግብ እና መግለጫ" : "Dish & Description"}</th>
            <th className={styles.tableColHideMobile}>
              {lang === "am" ? "ምድብ / ባህሪ" : "Course & Dietary"}
            </th>
            <th className={styles.tableColHideSmall}>
              {lang === "am" ? "መጠን / ምርጫ" : "Portions & Sizes"}
            </th>
            <th style={{ textAlign: "right" }}>
              {lang === "am" ? "ዋጋ" : "Price"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rowItems.map((rawItem) => {
            const item = { ...rawItem, ...ratings[rawItem.id] };
            const discounted =
              item.discountPrice != null && item.discountPrice < item.price;
            const variants = normalizeItemVariants(item.variants);
            const displayName = resolveLocalizedText(
              item.name,
              item.nameAm,
              lang
            );
            const secondaryName =
              lang === "en" && item.nameAm
                ? item.nameAm
                : lang === "am" && item.name
                ? item.name
                : null;
            const displayDesc = resolveLocalizedText(
              item.description,
              item.descriptionAm,
              lang
            );
            const fasting = isFastingFriendly(item);

            return (
              <tr
                key={item.id}
                onClick={() => setSelectedItem(rawItem)}
                tabIndex={0}
                role="button"
                aria-label={`${displayName}, view details`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedItem(rawItem);
                  }
                }}
                className={`${styles.tableRow} ${
                  !item.isAvailable ? styles.tableRowSoldOut : ""
                }`}
              >
                <td>
                  <div className={styles.tableDishCell}>
                    <div className={styles.tableThumb}>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          unoptimized
                          className={styles.cover}
                        />
                      ) : (
                        <span style={{ fontWeight: 800, fontSize: 15 }}>
                          {displayName.trim().charAt(0).toUpperCase() || (
                            <Utensils size={18} strokeWidth={1.5} />
                          )}
                        </span>
                      )}
                      {item.videoUrl && (
                        <span className={styles.tableVideoDot} title="Video available">
                          <Play size={8} fill="currentColor" />
                        </span>
                      )}
                    </div>
                    <div className={styles.tableDishInfo}>
                      <div className={styles.tableDishTitle}>
                        <span>{displayName}</span>
                        {secondaryName && (
                          <small className={styles.tableSecondaryName}>
                            {secondaryName}
                          </small>
                        )}
                        {!item.isAvailable && (
                          <span className={styles.tableSoldOutBadge}>
                            {lang === "am" ? "አልቋል" : "Sold Out"}
                          </span>
                        )}
                      </div>
                      {displayDesc && (
                        <p className={styles.tableDishDesc}>{displayDesc}</p>
                      )}
                      <div className={styles.tableMobileMeta}>
                        <span>{rawItem.categoryName}</span>
                        {fasting && (
                          <span className={styles.fastingBadge}>
                            <Leaf size={9} /> {lang === "am" ? "የጾም" : "ጾም"}
                          </span>
                        )}
                        {variants.length > 0 && (
                          <span>
                            {variants
                              .map(
                                (v) =>
                                  `${v.label}: ${formatPrice(
                                    v.price,
                                    hotel.currency,
                                    hotel.currencySymbol
                                  )}`
                              )
                              .join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.tableColHideMobile}>
                  <div className={styles.tableBadges}>
                    <span className={styles.tableCategoryPill}>
                      {rawItem.categoryName}
                    </span>
                    {item.isChefSpecial && (
                      <span className={styles.tableSpecialPill}>
                        <Sparkles size={10} />{" "}
                        {lang === "am" ? "የሼፍ ልዩ" : "Special"}
                      </span>
                    )}
                    {fasting && (
                      <span className={styles.fastingBadge}>
                        <Leaf size={10} /> {lang === "am" ? "የጾም" : "ጾም · Fasting"}
                      </span>
                    )}
                    {item.prepTimeMinutes && (
                      <span className={styles.tableMetaText}>
                        <Clock size={10} /> {item.prepTimeMinutes}m
                      </span>
                    )}
                  </div>
                </td>
                <td className={styles.tableColHideSmall}>
                  {variants.length > 0 ? (
                    <div className={styles.variantPills} style={{ marginTop: 0 }}>
                      {variants.map((v) => (
                        <span key={v.label} className={styles.variantPill}>
                          {v.label}:{" "}
                          {formatPrice(
                            v.price,
                            hotel.currency,
                            hotel.currencySymbol
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.tableMetaText}>
                      {lang === "am" ? "መደበኛ" : "Standard portion"}
                    </span>
                  )}
                </td>
                <td className={styles.tablePriceCell}>
                  <div className={styles.tablePriceBox}>
                    <span className={styles.price}>
                      {discounted && (
                        <s className={styles.priceStrike}>
                          {formatPrice(
                            item.price,
                            hotel.currency,
                            hotel.currencySymbol
                          )}
                        </s>
                      )}
                      {formatPrice(
                        discounted ? item.discountPrice! : item.price,
                        hotel.currency,
                        hotel.currencySymbol
                      )}
                    </span>
                    {item.reviewCount && item.ratingAverage != null ? (
                      <span className={styles.tableRating}>
                        <Star size={10} fill="currentColor" />{" "}
                        {item.ratingAverage.toFixed(1)}
                      </span>
                    ) : (
                      <span className={styles.tableViewHint}>
                        {lang === "am" ? "ዝርዝር" : "View"}{" "}
                        <ChevronRight size={11} />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderPosterMealCards = () => {
    let globalMealIdx =
      browseMode === "pages" ? (currentPage - 1) * ITEMS_PER_PAGE : 0;

    return (
      <div className={styles.mealPosterCanvas}>
        {visibleCategories.map((category) => (
          <section key={category.id} className={styles.mealCategoryGroup}>
            <div className={styles.mealCategoryDivider}>
              <h2 className={styles.mealCategoryHeading}>
                {category.localizedName}
              </h2>
              <span className={styles.mealCategoryCountBadge}>
                {category.totalCategoryCount}
              </span>
            </div>

            <div className={styles.mealCardStack}>
              {category.matchingItems.map((rawItem) => {
                const mealIdx = globalMealIdx++;
                const isPhotoLeft = mealIdx % 2 === 0;
                const item = { ...rawItem, ...ratings[rawItem.id] };
                const discounted =
                  item.discountPrice != null && item.discountPrice < item.price;
                const variants = normalizeItemVariants(item.variants);
                const displayName = resolveLocalizedText(
                  item.name,
                  item.nameAm,
                  lang
                );
                const secondaryName =
                  lang === "en" && item.nameAm
                    ? item.nameAm
                    : lang === "am" && item.name
                    ? item.name
                    : null;
                const displayDescription = resolveLocalizedText(
                  item.description,
                  item.descriptionAm,
                  lang
                );
                const fasting = isFastingFriendly(item);
                const plateImageUrl = resolveMealPlateImage(
                  item,
                  category.name,
                  category.imageUrl,
                  mealIdx
                );

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(rawItem)}
                    className={`${styles.mealPosterRow} ${
                      isPhotoLeft ? styles.mealRowLeft : styles.mealRowRight
                    } ${!item.isAvailable ? styles.mealRowSoldOut : ""}`}
                    aria-haspopup="dialog"
                  >
                    {/* Protruding Circular White-Bordered Food Plate */}
                    <div className={styles.mealPlateWrap}>
                      <div className={styles.mealPlateRing}>
                        <Image
                          src={plateImageUrl}
                          alt={displayName}
                          fill
                          sizes="(max-width: 768px) 160px, 200px"
                          unoptimized
                          className={styles.mealPlateImg}
                        />
                      </div>
                    </div>

                    {/* Deep Espresso Rounded Meal Banner */}
                    <div className={styles.mealBannerPill}>
                      <div className={styles.mealBannerContent}>
                        <h3 className={styles.mealBannerTitle}>
                          {displayName}
                          {secondaryName && (
                            <small className={styles.mealBannerSecondary}>
                              {" "}
                              ({secondaryName})
                            </small>
                          )}
                        </h3>

                        {displayDescription && (
                          <p className={styles.mealBannerDesc}>
                            {displayDescription}
                          </p>
                        )}

                        {(fasting || !item.isAvailable) && (
                          <div className={styles.mealBannerBadges}>
                            {fasting && (
                              <span className={styles.mealFastingBadge}>
                                {lang === "am" ? "የጾም" : "ጾም · FASTING"}
                              </span>
                            )}
                            {!item.isAvailable && (
                              <span className={styles.mealSoldOutBadge}>
                                {lang === "am" ? "አልቋል" : "SOLD OUT"}
                              </span>
                            )}
                          </div>
                        )}

                        {variants.length > 0 ? (
                          <div className={styles.mealVariantLines}>
                            {variants.map((v) => (
                              <div
                                key={v.label}
                                className={styles.mealVariantLine}
                              >
                                <span className={styles.mealVariantLabel}>
                                  {v.label}
                                </span>
                                <span className={styles.mealVariantPrice}>
                                  (
                                  {formatPrice(
                                    v.price,
                                    hotel.currency,
                                    hotel.currencySymbol
                                  )}
                                  )
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.mealBannerPrice}>
                            {discounted && (
                              <s className={styles.mealBannerPriceStrike}>
                                {formatPrice(
                                  item.price,
                                  hotel.currency,
                                  hotel.currencySymbol
                                )}
                              </s>
                            )}
                            <span>
                              {formatPrice(
                                discounted ? item.discountPrice! : item.price,
                                hotel.currency,
                                hotel.currencySymbol
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const itemsContainerClass =
    viewMode === "GRID"
      ? styles.gridContainer
      : viewMode === "MAGAZINE"
      ? styles.magazineContainer
      : viewMode === "LIST"
      ? styles.listContainer
      : styles.cardsContainer;

  return (
    <div className={styles.shell}>
      {isPreview && <div className={styles.preview}>{previewLabel}</div>}
      <div
        className={`${styles.column} ${
          viewMode === "CARDS" ? styles.posterColumn : ""
        }`}
      >
        {/* Crave Corner Style Poster Brand Header */}
        <section className={styles.welcomeHero}>
          {bannerImage && (
            <div className={styles.heroCoverWrap}>
              <Image
                src={bannerImage}
                alt=""
                fill
                sizes="100vw"
                unoptimized
                className={styles.heroCoverImg}
              />
              <div className={styles.heroCoverOverlay} />
            </div>
          )}
          <div className={styles.heroContent}>
            <div className={styles.posterTopTools}>
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label="Switch language between English and Amharic"
                className={`${styles.langToggle} ${
                  lang === "am" ? styles.langToggleActive : ""
                }`}
              >
                <span>{lang === "am" ? "አማ · EN" : "EN · አማ"}</span>
              </button>
              <button
                type="button"
                aria-label="Search menu"
                aria-expanded={searchOpen || Boolean(searchQuery)}
                onClick={() => {
                  if (searchOpen && searchQuery) {
                    setSearchQuery("");
                  }
                  setSearchOpen((prev) => !prev);
                }}
                className={`${styles.iconButton} ${
                  searchOpen || searchQuery ? styles.toolActive : ""
                }`}
                title="Search menu"
              >
                <Search size={14} />
              </button>
              <button
                type="button"
                aria-label="Dietary and meal filters"
                aria-expanded={filtersOpen}
                aria-controls="menu-filters"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`${styles.iconButton} ${
                  filtersOpen ||
                  dietary.length > 0 ||
                  fastingOnly ||
                  specialsOnly
                    ? styles.toolActive
                    : ""
                }`}
                title="Dietary & preferences"
              >
                <SlidersHorizontal size={14} />
              </button>
              <button
                type="button"
                aria-label="Share menu"
                onClick={() => setShareOpen(true)}
                className={styles.iconButton}
                title="Share menu or QR code"
              >
                <Share2 size={14} />
              </button>
            </div>

            <div className={styles.posterBannerGrid}>
              {/* Left Emblem: Logo/Utensils + Stacked Restaurant Name + Smile Swoosh */}
              <div className={styles.posterBrandBlock}>
                <div className={styles.posterEmblemTop}>
                  {hotel.logoUrl ? (
                    <div className={styles.logo}>
                      <Image
                        src={hotel.logoUrl}
                        alt=""
                        fill
                        sizes="46px"
                        unoptimized
                        className={styles.cover}
                      />
                    </div>
                  ) : (
                    <div className={styles.posterChefIcons} aria-hidden="true">
                      <Utensils size={18} className={styles.posterUtensilIcon} />
                      <Flame size={22} className={styles.flame} />
                    </div>
                  )}
                </div>
                <div className={styles.posterHotelName}>
                  {words.length > 0 && <span>{words.join(" ")}</span>}
                  <strong>{accentWord}</strong>
                </div>
                <svg
                  viewBox="0 0 120 26"
                  className={styles.posterSwoosh}
                  aria-hidden="true"
                >
                  <path
                    d="M12 6 C 40 24, 82 24, 110 6 C 84 18, 42 18, 12 6 Z"
                    fill="#ef2b1d"
                  />
                  <ellipse
                    cx="32"
                    cy="19"
                    rx="6"
                    ry="8"
                    transform="rotate(-18 32 19)"
                    fill="#ef2b1d"
                  />
                </svg>
              </div>

              {/* Right Headline: Giant Golden FOOD MENU + Tagline */}
              <div className={styles.posterHeadlineBlock}>
                <h1 className={styles.posterMainTitle}>
                  {lang === "am" ? "የምግብ ዝርዝር" : "FOOD MENU"}
                </h1>
                <p className={styles.posterSubTagline}>
                  {hotel.tagline || menu.title || "CRAVE IT. LOVE IT. REPEAT"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Clean Single-Row Sticky Category Navigation (with on-demand Search & Filter drawers) */}
        <header className={styles.header}>
          {(searchOpen || searchQuery) && (
            <div className={styles.searchDrawer}>
              <label className={styles.search}>
                <Search size={15} />
                <input
                  autoFocus
                  aria-label="Search menu"
                  placeholder={
                    lang === "am"
                      ? "ምግብ ወይም መጠጥ ይፈልጉ…"
                      : "Search dishes or drinks…"
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {(searchQuery || searchOpen) && (
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
            </div>
          )}

          <nav className={styles.categories} aria-label="Menu categories">
            <button
              type="button"
              aria-pressed={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            >
              <span>{lang === "am" ? "ሁሉም" : "All"}</span>
              <small className={styles.catCountPill}>{totalMenuCount}</small>
            </button>
            {menu.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                <span>
                  {resolveLocalizedText(category.name, category.nameAm, lang)}
                </span>
                <small className={styles.catCountPill}>
                  {category.items.length}
                </small>
              </button>
            ))}
          </nav>

          {filtersOpen && (
            <div id="menu-filters" className={styles.filters}>
              <div className={styles.quickBar}>
                <button
                  type="button"
                  aria-pressed={fastingOnly}
                  onClick={() => setFastingOnly((prev) => !prev)}
                  className={`${styles.quickPill} ${
                    fastingOnly ? styles.quickPillActive : ""
                  }`}
                >
                  <Leaf size={12} />
                  <span>
                    {lang === "am" ? "የጾም ምግቦች" : "ጾም · Fasting Friendly"}
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={specialsOnly}
                  onClick={() => setSpecialsOnly((prev) => !prev)}
                  className={`${styles.quickPill} ${
                    specialsOnly ? styles.quickPillActive : ""
                  }`}
                >
                  <Sparkles size={12} />
                  <span>{lang === "am" ? "የሼፍ ልዩ" : "Chef’s Specials"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(true)}
                  className={`${styles.quickPill} ${styles.budgetPill}`}
                >
                  <Wallet size={12} />
                  <span>
                    {lang === "am" ? "በበጀት ምርጫ" : "Budget Meal Finder"}
                  </span>
                </button>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={styles.clearFiltersPill}
                  >
                    <X size={11} />
                    <span>{lang === "am" ? "ሁሉንም አሳይ" : "Clear"}</span>
                  </button>
                )}
              </div>

              <div className={styles.filterTags}>
                {DIETARY_OPTIONS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    aria-pressed={dietary.includes(tag.value)}
                    onClick={() =>
                      setDietary((current) =>
                        current.includes(tag.value)
                          ? current.filter((value) => value !== tag.value)
                          : [...current, tag.value]
                      )
                    }
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <main
          className={`${styles.menu} ${
            viewMode === "CARDS" ? styles.posterMainCanvas : ""
          }`}
          id="menu-list"
        >
          {items.length ? (
            viewMode === "CARDS" ? (
              renderPosterMealCards()
            ) : viewMode === "TABLE" ? (
              renderTableRows(activeItems)
            ) : activeCategory === "all" && !hasFilters ? (
              <div className={styles.courseSectionsWrap}>
                {visibleCategories.map((category) => (
                  <section key={category.id} className={styles.courseSection}>
                    <div className={styles.courseHeader}>
                      <div>
                        <h2 className={styles.courseTitle}>
                          {category.localizedName}
                        </h2>
                        {category.localizedDescription && (
                          <p className={styles.courseDescription}>
                            {category.localizedDescription}
                          </p>
                        )}
                      </div>
                      <span className={styles.courseCount}>
                        {category.totalCategoryCount}{" "}
                        {category.totalCategoryCount === 1 ? "dish" : "dishes"}
                      </span>
                    </div>
                    <div className={itemsContainerClass}>
                      {category.matchingItems.map((item) => (
                        <GuestItemCard
                          key={item.id}
                          item={{ ...item, ...ratings[item.id] }}
                          categoryName={item.categoryName}
                          layout={viewMode}
                          currency={hotel.currency}
                          currencySymbol={hotel.currencySymbol}
                          lang={lang}
                          onOpenDetail={() => setSelectedItem(item)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className={itemsContainerClass}>
                {activeItems.map((item) => (
                  <GuestItemCard
                    key={item.id}
                    item={{ ...item, ...ratings[item.id] }}
                    categoryName={item.categoryName}
                    layout={viewMode}
                    currency={hotel.currency}
                    currencySymbol={hotel.currencySymbol}
                    lang={lang}
                    onOpenDetail={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className={styles.empty}>
              <Utensils size={28} />
              <h2>
                {hasFilters
                  ? lang === "am"
                    ? "ምንም ምግብ አልተገኘም"
                    : "Nothing found this time"
                  : "Something good is on its way"}
              </h2>
              <p>
                {hasFilters
                  ? lang === "am"
                    ? "ሌላ ምግብ ይፈልጉ ወይም ማጣሪያውን ያጽዱ።"
                    : "Try a different dish or clear your filters."
                  : "The team is preparing this menu. Please check back soon."}
              </p>
              {(hasFilters || activeCategory !== "all") && (
                <button type="button" onClick={resetFilters}>
                  {lang === "am" ? "ሁሉንም ምግቦች አሳይ" : "Show all menu"}
                </button>
              )}
            </div>
          )}

          {/* Scroll-Based Progressive Loading + Numbered Pagination Controls */}
          {items.length > ITEMS_PER_PAGE && (
            <div className={styles.paginationDock}>
              {/* Progress Indicator */}
              <div className={styles.paginationMetaRow}>
                <span className={styles.paginationCountText}>
                  {browseMode === "pages"
                    ? lang === "am"
                      ? `ገጽ ${currentPage} ከ ${pages} (${items.length} ምግቦች)`
                      : `Page ${currentPage} of ${pages} · ${items.length} meals`
                    : lang === "am"
                    ? `${shownCount} ከ ${items.length} ምግቦች ታይተዋል`
                    : `Showing ${shownCount} of ${items.length} meals`}
                </span>
                <div className={styles.paginationProgressTrack} aria-hidden="true">
                  <div
                    className={styles.paginationProgressFill}
                    style={{
                      width: `${
                        browseMode === "pages"
                          ? Math.round((currentPage / pages) * 100)
                          : progressPercent
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Auto-Scroll Sentinel & Load More Button */}
              {hasMoreScrollItems && (
                <div ref={loadMoreRef} className={styles.loadMoreTriggerWrap}>
                  <button
                    type="button"
                    onClick={loadMoreItems}
                    className={styles.loadMoreBtn}
                  >
                    <ChevronDown size={15} />
                    <span>
                      {lang === "am"
                        ? `ተጨማሪ ምግቦች አሳይ (${
                            items.length - visibleCount
                          } ይቀራሉ)`
                        : `Load More Meals (${
                            items.length - visibleCount
                          } remaining)`}
                    </span>
                  </button>
                </div>
              )}

              {/* Numbered Page Navigation Bar */}
              <nav className={styles.menuPages} aria-label="Menu pages">
                <button
                  type="button"
                  className={styles.pageStepBtn}
                  disabled={browseMode === "pages" && currentPage === 1}
                  onClick={() =>
                    changePage(browseMode === "pages" ? currentPage - 1 : 1)
                  }
                >
                  <ChevronLeft size={14} />
                  <span>{lang === "am" ? "ቀዳሚ" : "Prev"}</span>
                </button>

                <div className={styles.pagePillsRow}>
                  {Array.from({ length: pages }, (_, idx) => idx + 1).map(
                    (pageNum) => {
                      const isActive =
                        browseMode === "pages"
                          ? currentPage === pageNum
                          : Math.ceil(shownCount / ITEMS_PER_PAGE) === pageNum;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => changePage(pageNum)}
                          aria-current={isActive ? "page" : undefined}
                          className={`${styles.pageNumPill} ${
                            isActive ? styles.pageNumPillActive : ""
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  className={styles.pageStepBtn}
                  disabled={
                    browseMode === "pages"
                      ? currentPage === pages
                      : shownCount >= items.length
                  }
                  onClick={() =>
                    changePage(
                      browseMode === "pages"
                        ? currentPage + 1
                        : Math.min(
                            pages,
                            Math.ceil(shownCount / ITEMS_PER_PAGE) + 1
                          )
                    )
                  }
                >
                  <span>{lang === "am" ? "ቀጣይ" : "Next"}</span>
                  <ChevronRight size={14} />
                </button>
              </nav>

              {browseMode === "pages" && (
                <button
                  type="button"
                  onClick={() => {
                    setBrowseMode("scroll");
                    setVisibleCount(
                      Math.max(ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    );
                  }}
                  className={styles.switchScrollModeBtn}
                >
                  {lang === "am"
                    ? "ወደ ተከታታይ ዝርዝር (Scroll) ተመለስ"
                    : "Switch to Continuous Scroll"}
                </button>
              )}
            </div>
          )}
        </main>

        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={styles.floatingTopBtn}
            aria-label="Scroll back to top"
            title="Back to top"
          >
            <ArrowUp size={18} />
          </button>
        )}
        <footer className={styles.footer}>
          <div className={styles.contact}>
            {hotel.phone && (
              <a href={`tel:${hotel.phone.replace(/[^+\d]/g, "")}`}>
                <Phone size={13} />
                {hotel.phone}
              </a>
            )}
            {hotel.website && /^https?:\/\//i.test(hotel.website) && (
              <a href={hotel.website} target="_blank" rel="noreferrer">
                <Globe size={13} />
                Website
              </a>
            )}
          </div>
          {(hotel.address || hotel.city || hotel.country) && (
            <p className={styles.location}>
              <MapPin size={13} />
              {[hotel.address, hotel.city, hotel.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          <p className={styles.allergyNote}>
            Food allergies? Please speak to the team before ordering.
          </p>
          <p className={styles.powered}>
            Made for good food. Powered by LuxMenu.
          </p>
        </footer>
      </div>

      {/* Budget Meal Builder Modal */}
      {budgetModalOpen && (
        <div
          className={styles.budgetOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBudgetModalOpen(false);
          }}
        >
          <div
            className={styles.budgetModal}
            role="dialog"
            aria-label="Budget Meal Builder"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div className={styles.categoryLabel}>
                  {lang === "am" ? "የበጀት ምግብ መምረጫ" : "Smart Combo Finder"}
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, marginTop: 4 }}>
                  {lang === "am"
                    ? "በበጀትዎ ምን መመገብ ይችላሉ?"
                    : `What can I eat for my budget?`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBudgetModalOpen(false)}
                className={styles.iconButton}
                aria-label="Close budget builder"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.budgetInputRow}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#fbbf24" }}>
                {hotel.currencySymbol}
              </span>
              <input
                type="number"
                min="1"
                step="10"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Enter your budget..."
                className={styles.budgetInput}
              />
            </div>

            <div className={styles.budgetPresets}>
              {["250", "400", "600", "1000", "1500"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudgetInput(preset)}
                  className={styles.budgetPresetBtn}
                >
                  {formatPrice(Number(preset), hotel.currency, hotel.currencySymbol)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFastingOnly((prev) => !prev)}
                className={`${styles.budgetPresetBtn} ${
                  fastingOnly ? styles.quickPillActive : ""
                }`}
              >
                <Leaf size={10} style={{ display: "inline", marginRight: 4 }} />
                {lang === "am" ? "የጾም ብቻ" : "ጾም Only"}
              </button>
            </div>

            <div style={{ marginTop: "14px" }}>
              {budgetCombos.length === 0 ? (
                <div className={styles.empty} style={{ padding: "20px" }}>
                  <p>
                    {lang === "am"
                      ? "በዚህ በጀት የሚገኝ ምርጫ የለም። እባክዎ መጠኑን ከፍ ያድርጉ።"
                      : "No combinations found within this budget. Try increasing the amount above."}
                  </p>
                </div>
              ) : (
                budgetCombos.map((combo) => (
                  <div key={combo.id} className={styles.budgetComboCard}>
                    <div className={styles.budgetComboHeader}>
                      <span>{combo.label}</span>
                      <span>
                        Total:{" "}
                        {formatPrice(
                          combo.totalPrice,
                          hotel.currency,
                          hotel.currencySymbol
                        )}{" "}
                        (Save{" "}
                        {formatPrice(
                          combo.remainingBudget,
                          hotel.currency,
                          hotel.currencySymbol
                        )}
                        )
                      </span>
                    </div>
                    <div className={styles.budgetComboItems}>
                      {combo.items.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => {
                            const fullItem = itemLookup.get(entry.id);
                            if (fullItem) {
                              setBudgetModalOpen(false);
                              setSelectedItem(fullItem);
                            }
                          }}
                          className={styles.budgetComboItem}
                        >
                          <span>
                            {resolveLocalizedText(
                              entry.name,
                              entry.nameAm,
                              lang
                            )}{" "}
                            <small style={{ color: "#a1a1aa", fontWeight: 500 }}>
                              · {entry.categoryName}
                            </small>
                          </span>
                          <span style={{ color: "#fbbf24" }}>
                            {formatPrice(
                              entry.price,
                              hotel.currency,
                              hotel.currencySymbol
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <GuestItemModal
        initialSection={walkthroughStage === "reviews" ? "reviews" : undefined}
        onRatingUpdate={updateRating}
        isPreview={isPreview}
        item={selectedItem}
        categoryName={selectedItem?.categoryName}
        onClose={() => setSelectedItem(null)}
        currency={hotel.currency}
        currencySymbol={hotel.currencySymbol}
        lang={lang}
      />
      <GuestShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        menuTitle={menu.title}
        hotelName={hotel.name}
        menuSlug={menu.slug}
        menuId={menu.id}
        qrCodeSvg={menu.qrCodeSvg}
      />
    </div>
  );
}


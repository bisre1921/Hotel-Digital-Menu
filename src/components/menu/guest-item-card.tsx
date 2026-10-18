"use client";

import Image from "next/image";
import { ChevronRight, Play, Sparkles, Utensils, Star, Leaf } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  type GuestLanguage,
  isFastingFriendly,
  normalizeItemVariants,
  resolveLocalizedText,
} from "@/lib/menu-helpers";
import styles from "./guest-menu.module.css";

export interface MenuItemData {
  id: string;
  name: string;
  nameAm?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  price: number;
  discountPrice?: number | null;
  variants?: unknown;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isAvailable: boolean;
  isChefSpecial: boolean;
  isFeatured: boolean;
  calories?: number | null;
  prepTimeMinutes?: number | null;
  dietaryTags: string[];
  allergens: string[];
  ratingAverage?: number | null;
  reviewCount?: number;
}

export type GuestLayoutMode = "GRID" | "LIST" | "CARDS" | "MAGAZINE" | "TABLE";

interface Props {
  item: MenuItemData;
  categoryName?: string;
  layout: GuestLayoutMode;
  currencySymbol: string;
  currency: string;
  lang?: GuestLanguage;
  onOpenDetail: (item: MenuItemData) => void;
  primaryColor?: string;
}

export function GuestItemCard({
  item,
  categoryName,
  layout,
  currencySymbol,
  currency,
  lang = "en",
  onOpenDetail,
}: Props) {
  const discounted = item.discountPrice != null && item.discountPrice < item.price;
  const variants = normalizeItemVariants(item.variants);
  const displayName = resolveLocalizedText(item.name, item.nameAm, lang);
  const secondaryName =
    lang === "en" && item.nameAm
      ? item.nameAm
      : lang === "am" && item.name
      ? item.name
      : null;
  const displayDescription = resolveLocalizedText(item.description, item.descriptionAm, lang);
  const fasting = isFastingFriendly(item);

  const hasMedia = Boolean(item.imageUrl || item.videoUrl);

  const layoutClass =
    layout === "GRID"
      ? styles.cardGrid
      : layout === "MAGAZINE"
      ? `${styles.cardMagazine} ${item.isChefSpecial || item.isFeatured ? styles.cardMagazineFeatured : ""}`
      : layout === "LIST"
      ? styles.cardCompact
      : styles.card;

  return (
    <button
      type="button"
      className={`${layoutClass} ${!item.isAvailable ? styles.soldOut : ""}`}
      onClick={() => onOpenDetail(item)}
      aria-haspopup="dialog"
      aria-label={`${displayName}, ${formatPrice(
        discounted ? item.discountPrice! : item.price,
        currency,
        currencySymbol
      )}${!item.isAvailable ? ", sold out" : ""}. View details`}
    >
      {hasMedia ? (
        <span className={styles.thumbnail}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              fill
              sizes={layout === "GRID" || layout === "MAGAZINE" ? "(min-width: 768px) 340px, 50vw" : "120px"}
              unoptimized
              className={styles.cover}
            />
          ) : (
            <Utensils size={layout === "GRID" ? 30 : 24} strokeWidth={1.5} aria-hidden="true" />
          )}
          {item.videoUrl && (
            <span className={styles.videoBadge}>
              <Play size={9} fill="currentColor" /> Video
            </span>
          )}
          {item.isChefSpecial && (layout === "GRID" || layout === "MAGAZINE") && (
            <span className={styles.cornerBadge}>
              <Sparkles size={10} /> {lang === "am" ? "የሼፍ ልዩ" : "Chef’s Special"}
            </span>
          )}
        </span>
      ) : layout === "GRID" ? (
        <span className={styles.thumbnailPlaceholderGrid} aria-hidden="true">
          <span className={styles.monogramBadge}>
            {displayName.trim().charAt(0).toUpperCase() || <Utensils size={18} strokeWidth={1.5} />}
          </span>
          {item.isChefSpecial && (
            <span className={styles.cornerBadge}>
              <Sparkles size={10} /> {lang === "am" ? "የሼፍ ልዩ" : "Chef’s Special"}
            </span>
          )}
        </span>
      ) : null}
      <span className={styles.cardBody}>
        <span className={styles.cardTop}>
          <span className={styles.categoryLabel}>{categoryName || "Menu"}</span>
          <span className={styles.price}>
            {discounted && (
              <s className={styles.priceStrike}>
                {formatPrice(item.price, currency, currencySymbol)}
              </s>
            )}
            {formatPrice(discounted ? item.discountPrice! : item.price, currency, currencySymbol)}
          </span>
        </span>
        <span className={styles.itemName}>
          {displayName}
          {secondaryName && <small className={styles.secondaryName}> · {secondaryName}</small>}
        </span>
        {displayDescription && <span className={styles.itemDescription}>{displayDescription}</span>}
        {variants.length > 0 && (
          <span className={styles.variantPills}>
            {variants.slice(0, 4).map((v) => (
              <span key={v.label} className={styles.variantPill}>
                {v.label}: {formatPrice(v.price, currency, currencySymbol)}
              </span>
            ))}
          </span>
        )}
        <span className={styles.cardBottom}>
          <span className={styles.itemStatus}>
            {!item.isAvailable ? (
              lang === "am" ? "ዛሬ አልቋል" : "Sold out today"
            ) : item.reviewCount && item.ratingAverage != null ? (
              <>
                <Star size={12} fill="currentColor" /> {item.ratingAverage.toFixed(1)} ({item.reviewCount})
              </>
            ) : item.isChefSpecial ? (
              <>
                <Sparkles size={12} /> {lang === "am" ? "የሼፍ ልዩ ምርጫ" : "Chef’s special"}
              </>
            ) : fasting ? (
              <span className={styles.fastingBadge}>
                <Leaf size={10} /> {lang === "am" ? "የጾም" : "ጾም · Fasting"}
              </span>
            ) : discounted ? (
              <>Special offer</>
            ) : lang === "am" ? (
              "ዛሬ ይገኛል"
            ) : (
              "Freshly prepared"
            )}
          </span>
          <span className={styles.detailLink}>
            {item.videoUrl
              ? lang === "am"
                ? "ቪዲዮ እና ዝርዝር"
                : "Watch & details"
              : lang === "am"
              ? "ዝርዝር ይመልከቱ"
              : "Details"}
            <ChevronRight size={12} />
          </span>
        </span>
      </span>
    </button>
  );
}



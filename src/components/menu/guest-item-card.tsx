"use client";

import Image from "next/image";
import { ChevronRight, Play, Sparkles, Utensils, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import styles from "./guest-menu.module.css";

export interface MenuItemData {
  id: string; name: string; description?: string | null; price: number;
  discountPrice?: number | null; imageUrl?: string | null; videoUrl?: string | null;
  isAvailable: boolean; isChefSpecial: boolean; isFeatured: boolean;
  calories?: number | null; prepTimeMinutes?: number | null;
  dietaryTags: string[]; allergens: string[]; ratingAverage?: number | null; reviewCount?: number;
}
interface Props {
  item: MenuItemData; categoryName?: string; layout: "GRID" | "LIST" | "CARDS" | "MAGAZINE";
  currencySymbol: string; currency: string; onOpenDetail: (item: MenuItemData) => void; primaryColor?: string;
}

export function GuestItemCard({ item, categoryName, currencySymbol, currency, onOpenDetail }: Props) {
  const discounted = item.discountPrice != null && item.discountPrice < item.price;
  return <button type="button" className={`${styles.card} ${!item.isAvailable ? styles.soldOut : ""}`} onClick={() => onOpenDetail(item)} aria-haspopup="dialog" aria-label={`${item.name}, ${formatPrice(discounted ? item.discountPrice! : item.price, currency, currencySymbol)}${!item.isAvailable ? ", sold out" : ""}. View details`}>
    <span className={styles.thumbnail}>
      {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="96px" unoptimized className={styles.cover} /> : <Utensils size={28} strokeWidth={1.4} aria-hidden="true" />}
      {item.videoUrl && <span className={styles.videoBadge}><Play size={9} fill="currentColor" /> Video</span>}
    </span>
    <span className={styles.cardBody}>
      <span className={styles.cardTop}><span className={styles.categoryLabel}>{categoryName || "Menu"}</span><span className={styles.price}>{formatPrice(discounted ? item.discountPrice! : item.price, currency, currencySymbol)}</span></span>
      <span className={styles.itemName}>{item.name}</span>
      {item.description && <span className={styles.itemDescription}>{item.description}</span>}
      <span className={styles.cardBottom}>
        <span className={styles.itemStatus}>{!item.isAvailable ? "Sold out today" : item.reviewCount && item.ratingAverage != null ? <><Star size={12} fill="currentColor" /> {item.ratingAverage.toFixed(1)} ({item.reviewCount})</> : item.isChefSpecial ? <><Sparkles size={12} /> Chef’s special</> : discounted ? <><s>{formatPrice(item.price, currency, currencySymbol)}</s> Special price</> : "Available today"}</span>
        <span className={styles.detailLink}>{item.videoUrl ? "Watch & details" : "View details"}<ChevronRight size={12} /></span>
      </span>
    </span>
  </button>;
}

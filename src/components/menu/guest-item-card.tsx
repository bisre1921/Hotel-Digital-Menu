"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Sparkles, Clock, Flame, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DIETARY_OPTIONS } from "@/config/theme";

export interface MenuItemData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isAvailable: boolean;
  isChefSpecial: boolean;
  isFeatured: boolean;
  calories?: number | null;
  prepTimeMinutes?: number | null;
  dietaryTags: string[];
  allergens: string[];
}

interface GuestItemCardProps {
  item: MenuItemData;
  layout: "GRID" | "LIST" | "CARDS" | "MAGAZINE";
  currencySymbol: string;
  currency: string;
  onOpenDetail: (item: MenuItemData) => void;
  primaryColor?: string;
}

export function GuestItemCard({
  item,
  layout,
  currencySymbol,
  currency,
  onOpenDetail,
  primaryColor = "#B89334",
}: GuestItemCardProps) {
  const isAvailable = item.isAvailable;

  // Minimalist List Layout
  if (layout === "LIST") {
    return (
      <motion.div
        whileHover={isAvailable ? { x: 4 } : {}}
        onClick={() => onOpenDetail(item)}
        className={`group p-4 rounded-xl border border-border/50 hover:border-gold-500/40 bg-card/60 hover:bg-card transition-all cursor-pointer relative overflow-hidden ${
          !isAvailable ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-serif text-lg font-medium tracking-tight text-foreground group-hover:text-gold-400 transition-colors">
                {item.name}
              </h4>
              {item.isChefSpecial && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  <Sparkles className="w-2.5 h-2.5" /> Chef Special
                </span>
              )}
              {!isAvailable && (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
                  Unavailable Today
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 font-sans font-light">
                {item.description}
              </p>
            )}

            {/* Tags row */}
            {item.dietaryTags.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {item.dietaryTags.map((tag) => {
                  const info = DIETARY_OPTIONS.find((d) => d.value === tag);
                  return (
                    <span
                      key={tag}
                      className="text-[10px] uppercase font-medium px-2 py-0.5 rounded border bg-secondary/40 text-muted-foreground border-border/60"
                    >
                      {info?.label || tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="text-right">
              {item.discountPrice ? (
                <div className="flex flex-col items-end">
                  <span className="text-base font-semibold text-gold-400">
                    {formatPrice(item.discountPrice, currency, currencySymbol)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(item.price, currency, currencySymbol)}
                  </span>
                </div>
              ) : (
                <span className="text-base font-semibold text-foreground">
                  {formatPrice(item.price, currency, currencySymbol)}
                </span>
              )}
            </div>
            {item.videoUrl && (
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                <Play className="w-2.5 h-2.5 fill-current" /> Video
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Cards Layout (Luxury horizontal card with full image)
  if (layout === "CARDS") {
    return (
      <motion.div
        whileHover={isAvailable ? { y: -3 } : {}}
        onClick={() => onOpenDetail(item)}
        className={`group flex flex-col sm:flex-row rounded-2xl border border-border/60 hover:border-gold-500/50 bg-card overflow-hidden shadow-subtle hover:shadow-elevated transition-all cursor-pointer ${
          !isAvailable ? "opacity-65" : ""
        }`}
      >
        {item.imageUrl && (
          <div className="relative sm:w-56 h-48 sm:h-auto shrink-0 overflow-hidden bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {item.videoUrl && (
              <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md">
                <Play className="w-3 h-3 fill-current text-white" />
              </div>
            )}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider bg-destructive/80 px-2.5 py-1 rounded-md">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-serif text-xl font-medium tracking-tight text-foreground group-hover:text-gold-400 transition-colors">
                {item.name}
              </h4>
              <div className="text-right shrink-0">
                {item.discountPrice ? (
                  <div>
                    <span className="text-lg font-semibold text-gold-400">
                      {formatPrice(item.discountPrice, currency, currencySymbol)}
                    </span>
                    <span className="block text-xs text-muted-foreground line-through">
                      {formatPrice(item.price, currency, currencySymbol)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-foreground">
                    {formatPrice(item.price, currency, currencySymbol)}
                  </span>
                )}
              </div>
            </div>

            {item.description && (
              <p className="mt-2 text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.isChefSpecial && (
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Chef Special
                </span>
              )}
              {item.dietaryTags.map((tag) => {
                const info = DIETARY_OPTIONS.find((d) => d.value === tag);
                return (
                  <span
                    key={tag}
                    className="text-[10px] uppercase font-medium px-2 py-0.5 rounded border bg-secondary/50 text-foreground/80 border-border/60"
                  >
                    {info?.label || tag}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {item.calories && (
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" /> {item.calories} kcal
                </span>
              )}
              {item.prepTimeMinutes && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.prepTimeMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default Grid Layout (Modern Visual 2-Column Cards)
  return (
    <motion.div
      whileHover={isAvailable ? { y: -4 } : {}}
      onClick={() => onOpenDetail(item)}
      className={`group flex flex-col rounded-2xl border border-border/60 hover:border-gold-500/50 bg-card overflow-hidden shadow-subtle hover:shadow-elevated transition-all cursor-pointer ${
        !isAvailable ? "opacity-65" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/60 text-muted-foreground">
            <span className="font-serif italic text-sm">Artisanal Selection</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {item.isChefSpecial ? (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-black/80 text-gold-400 backdrop-blur-md border border-gold-500/40 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Chef Special
            </span>
          ) : <div />}

          {item.videoUrl && (
            <span className="p-1.5 rounded-full bg-black/70 text-white backdrop-blur-md">
              <Play className="w-3 h-3 fill-current text-white" />
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center backdrop-blur-xs">
            <span className="text-xs font-semibold text-white uppercase tracking-wider bg-destructive/90 px-3 py-1 rounded-md">
              Temporarily Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-serif text-lg font-medium tracking-tight text-foreground group-hover:text-gold-400 transition-colors leading-snug">
              {item.name}
            </h4>
          </div>

          {item.description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 font-light leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.dietaryTags.slice(0, 2).map((tag) => {
              const info = DIETARY_OPTIONS.find((d) => d.value === tag);
              return (
                <span
                  key={tag}
                  className="text-[9px] uppercase font-medium px-1.5 py-0.5 rounded border bg-secondary/50 text-foreground/80 border-border/60"
                >
                  {info?.label || tag}
                </span>
              );
            })}
          </div>

          <div className="text-right">
            {item.discountPrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-semibold text-gold-400">
                  {formatPrice(item.discountPrice, currency, currencySymbol)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(item.price, currency, currencySymbol)}
                </span>
              </div>
            ) : (
              <span className="text-base font-semibold text-foreground">
                {formatPrice(item.price, currency, currencySymbol)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

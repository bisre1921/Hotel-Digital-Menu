"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Clock, Flame, AlertTriangle, ShieldCheck } from "lucide-react";
import { MenuItemData } from "./guest-item-card";
import { formatPrice } from "@/lib/utils";
import { DIETARY_OPTIONS, ALLERGEN_OPTIONS } from "@/config/theme";

interface GuestItemModalProps {
  item: MenuItemData | null;
  onClose: () => void;
  currencySymbol: string;
  currency: string;
  primaryColor?: string;
}

export function GuestItemModal({
  item,
  onClose,
  currencySymbol,
  currency,
  primaryColor = "#B89334",
}: GuestItemModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (item) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border/70 shadow-luxury z-10 no-scrollbar"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Media Section: Image or Video */}
          <div className="relative aspect-video w-full bg-muted overflow-hidden">
            {item.videoUrl ? (
              <video
                src={item.videoUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                <span className="font-serif italic text-muted-foreground text-lg">
                  Artisanal Dish Presentation
                </span>
              </div>
            )}

            {/* Chef special badge */}
            {item.isChefSpecial && (
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-gold-400 border border-gold-500/40 text-xs font-medium tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Chef&apos;s Signature Creation
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                  {item.name}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {item.prepTimeMinutes && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.prepTimeMinutes} mins prep
                    </span>
                  )}
                  {item.calories && (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> {item.calories} calories
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                {item.discountPrice ? (
                  <div>
                    <span className="text-2xl font-serif font-semibold text-gold-400">
                      {formatPrice(item.discountPrice, currency, currencySymbol)}
                    </span>
                    <span className="block text-sm text-muted-foreground line-through">
                      {formatPrice(item.price, currency, currencySymbol)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-serif font-semibold text-foreground">
                    {formatPrice(item.price, currency, currencySymbol)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm sm:text-base text-foreground/80 font-light leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Dietary Tags */}
            {item.dietaryTags.length > 0 && (
              <div>
                <h5 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Dietary Information
                </h5>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.dietaryTags.map((tag) => {
                    const info = DIETARY_OPTIONS.find((d) => d.value === tag);
                    return (
                      <span
                        key={tag}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                          info?.color || "bg-secondary text-foreground border-border"
                        }`}
                      >
                        {info?.label || tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allergens warning */}
            {item.allergens.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-4 h-4" /> Contains Allergens
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-foreground/80">
                  {item.allergens.map((all) => {
                    const info = ALLERGEN_OPTIONS.find((a) => a.value === all);
                    return (
                      <span key={all} className="font-medium underline decoration-amber-500/50">
                        {info?.label || all}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Availability status */}
            {!item.isAvailable && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                This dish is currently unavailable or sold out for today&apos;s service.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

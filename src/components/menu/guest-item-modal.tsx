"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useAnimationControls, useDragControls, useReducedMotion } from "framer-motion";
import { ItemReviews } from "./item-reviews";
import { X, Clock, Flame, AlertTriangle, Play, Sparkles } from "lucide-react";
import { type MenuItemData } from "./guest-item-card";
import { formatPrice } from "@/lib/utils";
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS } from "@/config/theme";
import {
  type GuestLanguage,
  normalizeItemVariants,
  resolveLocalizedText,
} from "@/lib/menu-helpers";
import styles from "./guest-menu.module.css";

interface Props {
  initialSection?: "reviews";
  item: MenuItemData | null;
  categoryName?: string;
  onClose: () => void;
  currencySymbol: string;
  currency: string;
  lang?: GuestLanguage;
  primaryColor?: string;
  isPreview?: boolean;
  onRatingUpdate?: (id: string, average: number | null, count: number) => void;
}

export function GuestItemModal({
  initialSection,
  item,
  categoryName,
  onClose,
  currencySymbol,
  currency,
  lang = "en",
  isPreview = false,
  onRatingUpdate,
}: Props) {
  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const closing = useRef(false);
  const dragged = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!item) return;
    setVideoFailed(false);
    setSelectedVariantIdx(0);
    setExpanded(initialSection === "reviews");
    closing.current = false;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    controls.start({
      y: 0,
      opacity: 1,
      transition: reduceMotion ? { duration: 0 } : { type: "spring", damping: 32, stiffness: 300 },
    });
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => {
      if (initialSection === "reviews")
        element?.querySelector('[aria-label="Dish ratings and reviews"]')?.scrollIntoView({ block: "start" });
    });
    return () => {
      cancelAnimationFrame(focusFrame);
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [item, controls, reduceMotion, initialSection]);

  async function dismiss() {
    if (closing.current) return;
    closing.current = true;
    await controls.start({
      y: "100%",
      opacity: 0,
      transition: { duration: reduceMotion ? 0 : 0.24, ease: "easeIn" },
    });
    close.current();
  }

  if (!item) return null;
  const variants = normalizeItemVariants(item.variants);
  const activeVariant = variants[selectedVariantIdx] || null;
  const discounted = !activeVariant && item.discountPrice != null && item.discountPrice < item.price;
  const activePrice = activeVariant
    ? activeVariant.price
    : discounted
    ? item.discountPrice!
    : item.price;
  const displayName = resolveLocalizedText(item.name, item.nameAm, lang);
  const displayDescription = resolveLocalizedText(item.description, item.descriptionAm, lang);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="dish-title"
      onCancel={(event) => {
        event.preventDefault();
        void dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void dismiss();
      }}
    >
      <motion.div
        className={styles.sheet}
        initial={{ y: "100%", opacity: 0 }}
        animate={controls}
        style={{ height: expanded ? "94dvh" : "82dvh" }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.08, bottom: 0.65 }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_event, info) => {
          if (info.offset.y > 100 || info.velocity.y > 650) {
            void dismiss();
            return;
          }
          if (info.offset.y < -35 || info.velocity.y < -450) setExpanded(true);
          controls.start({
            y: 0,
            transition: reduceMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 350 },
          });
        }}
      >
        <button
          type="button"
          className={styles.sheetHandle}
          aria-label={expanded ? "Collapse dish details" : "Expand dish details"}
          onPointerDown={(event) => {
            dragged.current = false;
            dragControls.start(event);
          }}
          onClick={() => {
            if (!dragged.current) setExpanded((value) => !value);
          }}
        >
          <span />
        </button>
        <div className={styles.sheetScroll}>
          <div className={styles.modalMedia}>
            {item.videoUrl && !videoFailed ? (
              <video
                onError={() => setVideoFailed(true)}
                src={item.videoUrl}
                controls
                autoPlay
                muted
                playsInline
                loop
                preload="metadata"
                poster={item.imageUrl || undefined}
              />
            ) : item.imageUrl ? (
              <Image src={item.imageUrl} alt={displayName} fill sizes="448px" unoptimized className={styles.cover} />
            ) : (
              <span className={styles.mediaPlaceholder}>
                <Flame size={44} strokeWidth={1.3} />
                <span>Good food, worth discovering.</span>
              </span>
            )}
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => void dismiss()}
              aria-label="Close dish details"
              autoFocus
            >
              <X size={20} />
            </button>
            {item.videoUrl && !videoFailed && (
              <span className={styles.showcase}>
                <Play size={12} fill="currentColor" /> Food showcase
              </span>
            )}
          </div>
          <div className={styles.modalBody}>
            <div className={styles.modalHeading}>
              <div>
                <p className={styles.categoryLabel}>{categoryName || "On the menu"}</p>
                <h2 id="dish-title">{displayName}</h2>
              </div>
              <div className={styles.modalPrice}>
                {formatPrice(activePrice, currency, currencySymbol)}
                {discounted && <s>{formatPrice(item.price, currency, currencySymbol)}</s>}
              </div>
            </div>
            {!item.isAvailable && (
              <p className={styles.unavailableNotice}>
                {lang === "am"
                  ? "ይህ ምግብ ዛሬ አልቋል። እባክዎ ሌላ ምርጫ ይጠይቁ።"
                  : "Sold out today. Ask the team for another recommendation."}
              </p>
            )}
            {item.isChefSpecial && (
              <p className={styles.special}>
                <Sparkles size={14} /> {lang === "am" ? "የሼፍ ልዩ ምርጫ" : "A chef’s special"}
              </p>
            )}
            {variants.length > 0 && (
              <div className={styles.variantSelector}>
                <div className={styles.variantSelectorTitle}>
                  {lang === "am" ? "መጠን / ምርጫ ይምረጡ" : "Choose Portion / Size"}
                </div>
                <div className={styles.variantOptions}>
                  {variants.map((variant, idx) => (
                    <button
                      key={variant.label}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`${styles.variantOption} ${
                        selectedVariantIdx === idx ? styles.variantOptionActive : ""
                      }`}
                    >
                      <span>{variant.label}</span>
                      <span>· {formatPrice(variant.price, currency, currencySymbol)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {displayDescription && <p className={styles.description}>{displayDescription}</p>}
            <div className={styles.dishFacts}>
              {item.prepTimeMinutes != null && (
                <span>
                  <Clock size={14} />
                  {item.prepTimeMinutes} min
                </span>
              )}
              {item.calories != null && (
                <span>
                  <Flame size={14} />
                  {item.calories} kcal
                </span>
              )}
            </div>
            {!!item.dietaryTags.length && (
              <div className={styles.dietaryTags}>
                {item.dietaryTags.map((tag) => (
                  <span key={tag}>
                    {DIETARY_OPTIONS.find((option) => option.value === tag)?.label ||
                      tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            )}
            {!!item.allergens.length && (
              <div className={styles.allergenBox}>
                <h3>
                  <AlertTriangle size={15} /> Allergen information
                </h3>
                <p>
                  {item.allergens
                    .map(
                      (tag) =>
                        ALLERGEN_OPTIONS.find((option) => option.value === tag)?.label ||
                        tag.replaceAll("_", " ")
                    )
                    .join(" · ")}
                </p>
              </div>
            )}
            <ItemReviews
              key={item.id}
              itemId={item.id}
              isPreview={isPreview}
              onSummary={(average, count) => onRatingUpdate?.(item.id, average, count)}
            />
            <p className={styles.modalNote}>
              {lang === "am"
                ? "ማንኛውም የምግብ አለርጂ ካለብዎት ከማዘዝዎ በፊት ለአስተናጋጁ ያሳውቁ።"
                : "Please tell the team about any food allergies before ordering."}
            </p>
          </div>
        </div>
      </motion.div>
    </dialog>
  );
}


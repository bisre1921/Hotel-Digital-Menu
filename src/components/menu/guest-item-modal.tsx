"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationControls,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { ItemReviews } from "./item-reviews";
import {
  X,
  Clock,
  Flame,
  AlertTriangle,
  Play,
  Sparkles,
  Leaf,
  Star,
  Wallet,
  Share2,
  Check,
} from "lucide-react";
import { type MenuItemData } from "./guest-item-card";
import { formatPrice } from "@/lib/utils";
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS } from "@/config/theme";
import {
  type GuestLanguage,
  isFastingFriendly,
  normalizeItemVariants,
  resolveLocalizedText,
} from "@/lib/menu-helpers";
import styles from "./guest-menu.module.css";

interface Props {
  initialSection?: "reviews";
  item: MenuItemData | null;
  categoryName?: string;
  resolvedImageUrl?: string | null;
  onClose: () => void;
  onOpenBudgetFinder?: (suggestedBudget: number) => void;
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
  resolvedImageUrl,
  onClose,
  onOpenBudgetFinder,
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
  const [reviewFormSignal, setReviewFormSignal] = useState(0);
  const [dishCopied, setDishCopied] = useState(false);
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
    setReviewFormSignal(0);
    setDishCopied(false);
    setExpanded(initialSection === "reviews");
    closing.current = false;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    controls.start({
      y: 0,
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { type: "spring", damping: 32, stiffness: 300 },
    });
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => {
      if (initialSection === "reviews")
        element
          ?.querySelector('[aria-label="Dish ratings and reviews"]')
          ?.scrollIntoView({ block: "start" });
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
  const discounted =
    !activeVariant &&
    item.discountPrice != null &&
    item.discountPrice < item.price;
  const activePrice = activeVariant
    ? activeVariant.price
    : discounted
    ? item.discountPrice!
    : item.price;
  const displayName = resolveLocalizedText(item.name, item.nameAm, lang);
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
  const heroImageUrl = item.imageUrl || resolvedImageUrl || null;

  const handleShareDish = async () => {
    const shareText = `${displayName}${
      secondaryName ? ` (${secondaryName})` : ""
    } — ${formatPrice(activePrice, currency, currencySymbol)}`;
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: displayName,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`.trim());
      setDishCopied(true);
      setTimeout(() => setDishCopied(false), 2000);
    } catch {}
  };

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
        style={{ height: expanded ? "94dvh" : "86dvh" }}
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
            transition: reduceMotion
              ? { duration: 0 }
              : { type: "spring", damping: 30, stiffness: 350 },
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
                poster={heroImageUrl || undefined}
              />
            ) : heroImageUrl ? (
              <>
                <Image
                  src={heroImageUrl}
                  alt=""
                  fill
                  sizes="540px"
                  unoptimized
                  className={styles.modalMediaBackdrop}
                />
                <div className={styles.modalMediaBackdropOverlay} />
                <div className={styles.modalPlateCenter}>
                  <div className={styles.modalPlateRing}>
                    <Image
                      src={heroImageUrl}
                      alt={displayName}
                      fill
                      sizes="220px"
                      unoptimized
                      className={styles.cover}
                    />
                  </div>
                </div>
              </>
            ) : (
              <span className={styles.mediaPlaceholder}>
                <Flame size={44} strokeWidth={1.3} />
                <span>Good food, worth discovering.</span>
              </span>
            )}

            <div className={styles.modalMediaTopBadges}>
              {item.isChefSpecial && (
                <span className={styles.modalSpecialBadge}>
                  <Sparkles size={11} />
                  {lang === "am" ? "የሼፍ ልዩ ምርጫ" : "CHEF’S SPECIAL"}
                </span>
              )}
              {fasting && (
                <span className={styles.modalFastingBadge}>
                  <Leaf size={11} />
                  {lang === "am" ? "የጾም ምግብ" : "ጾም · FASTING FRIENDLY"}
                </span>
              )}
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => void dismiss()}
              aria-label="Close dish details"
              autoFocus
            >
              <X size={18} />
            </button>

            {item.videoUrl && !videoFailed && (
              <span className={styles.showcase}>
                <Play size={12} fill="currentColor" />{" "}
                {lang === "am" ? "የምግብ ቪዲዮ" : "Food showcase"}
              </span>
            )}
          </div>

          <div className={styles.modalBody}>
            <div className={styles.modalHeading}>
              <div className={styles.modalTitleGroup}>
                <p className={styles.modalCategoryPill}>
                  {categoryName || (lang === "am" ? "ምናሌ" : "On the menu")}
                </p>
                <h2 id="dish-title">{displayName}</h2>
                {secondaryName && (
                  <p className={styles.modalSecondaryTitle}>{secondaryName}</p>
                )}
              </div>
              <div className={styles.modalPrice}>
                <span>
                  {formatPrice(activePrice, currency, currencySymbol)}
                </span>
                {discounted && (
                  <s>{formatPrice(item.price, currency, currencySymbol)}</s>
                )}
                {activeVariant && (
                  <small className={styles.modalPriceVariantLabel}>
                    {activeVariant.label}
                  </small>
                )}
              </div>
            </div>

            {!item.isAvailable && (
              <p className={styles.unavailableNotice}>
                {lang === "am"
                  ? "ይህ ምግብ ዛሬ አልቋል። እባክዎ ሌላ ምርጫ ይጠይቁ።"
                  : "Sold out today. Ask the team for another recommendation."}
              </p>
            )}

            {/* Always-Visible Modal Feature Action Strip */}
            <div className={styles.modalQuickActions}>
              {!isPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(true);
                    setReviewFormSignal((n) => n + 1);
                  }}
                  className={styles.modalQuickActionBtn}
                >
                  <Star size={13} fill="currentColor" />
                  <span>
                    {lang === "am" ? "ደረጃ እና አስተያየት ይስጡ" : "Rate & Review Dish"}
                  </span>
                </button>
              )}
              {onOpenBudgetFinder && (
                <button
                  type="button"
                  onClick={() => {
                    const targetBudget = Math.max(
                      300,
                      Math.ceil((activePrice * 1.6) / 50) * 50
                    );
                    void dismiss();
                    onOpenBudgetFinder(targetBudget);
                  }}
                  className={styles.modalQuickActionBtn}
                >
                  <Wallet size={13} />
                  <span>
                    {lang === "am" ? "ከሌላ ምግብ ጋር አጣምር" : "Pair in Budget Finder"}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleShareDish}
                className={styles.modalQuickActionBtn}
              >
                {dishCopied ? <Check size={13} /> : <Share2 size={13} />}
                <span>
                  {dishCopied
                    ? lang === "am"
                      ? "ተቀድቷል!"
                      : "Copied!"
                    : lang === "am"
                    ? "ምግቡን አጋራ"
                    : "Share Dish"}
                </span>
              </button>
            </div>

            {variants.length > 0 && (
              <div className={styles.variantSelector}>
                <div className={styles.variantSelectorTitle}>
                  {lang === "am"
                    ? "መጠን / ምርጫ ይምረጡ (ዋጋው ይቀየራል)"
                    : "Choose Portion / Size"}
                </div>
                <div className={styles.variantOptions}>
                  {variants.map((variant, idx) => (
                    <button
                      key={variant.label}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`${styles.variantOption} ${
                        selectedVariantIdx === idx
                          ? styles.variantOptionActive
                          : ""
                      }`}
                    >
                      <span>{variant.label}</span>
                      <strong>
                        {formatPrice(variant.price, currency, currencySymbol)}
                      </strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {displayDescription && (
              <p className={styles.description}>{displayDescription}</p>
            )}

            {(item.prepTimeMinutes != null ||
              item.calories != null ||
              fasting ||
              item.isChefSpecial) && (
              <div className={styles.dishFacts}>
                {item.prepTimeMinutes != null && (
                  <span className={styles.dishFactPill}>
                    <Clock size={13} />
                    {lang === "am"
                      ? `${item.prepTimeMinutes} ደቂቃ ዝግጅት`
                      : `${item.prepTimeMinutes} min prep`}
                  </span>
                )}
                {item.calories != null && (
                  <span className={styles.dishFactPill}>
                    <Flame size={13} />
                    {item.calories} kcal
                  </span>
                )}
                {fasting && (
                  <span className={styles.dishFactPillFasting}>
                    <Leaf size={13} />
                    {lang === "am" ? "100% የጾም ምግብ" : "Fasting Friendly (ጾም)"}
                  </span>
                )}
              </div>
            )}

            {!!item.dietaryTags.length && (
              <div className={styles.dietaryTags}>
                {item.dietaryTags.map((tag) => (
                  <span key={tag}>
                    {DIETARY_OPTIONS.find((option) => option.value === tag)
                      ?.label || tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            )}

            {!!item.allergens.length && (
              <div className={styles.allergenBox}>
                <h3>
                  <AlertTriangle size={15} />{" "}
                  {lang === "am" ? "የአለርጂ መረጃ" : "Allergen Information"}
                </h3>
                <p>
                  {item.allergens
                    .map(
                      (tag) =>
                        ALLERGEN_OPTIONS.find((option) => option.value === tag)
                          ?.label || tag.replaceAll("_", " ")
                    )
                    .join(" · ")}
                </p>
              </div>
            )}

            <ItemReviews
              key={item.id}
              itemId={item.id}
              isPreview={isPreview}
              lang={lang}
              openFormSignal={reviewFormSignal}
              onSummary={(average, count) =>
                onRatingUpdate?.(item.id, average, count)
              }
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



"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, MessageSquarePlus } from "lucide-react";
import type { ReviewsResponse } from "@/lib/reviews";
import { reviewSchema } from "@/lib/reviews";
import type { GuestLanguage } from "@/lib/menu-helpers";
import styles from "./guest-menu.module.css";

export function ItemReviews({
  itemId,
  isPreview = false,
  lang = "en",
  openFormSignal = 0,
  onSummary,
}: {
  itemId: string;
  isPreview?: boolean;
  lang?: GuestLanguage;
  openFormSignal?: number;
  onSummary?: (average: number | null, count: number) => void;
}) {
  const summaryCallback = useRef(onSummary);
  summaryCallback.current = onSummary;
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const locked = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const initial = useRef(true);
  const load = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => {
    if (openFormSignal > 0 && !isPreview) {
      setFormOpen(true);
      setSuccess("");
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [openFormSignal, isPreview]);

  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetch(
      `/api/public/items/${encodeURIComponent(itemId)}/reviews?page=${page}`,
      { signal: controller.signal, cache: "no-store" }
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        return body as ReviewsResponse;
      })
      .then((body) => {
        setData(body);
        summaryCallback.current?.(body.average, body.total);
        if (!initial.current)
          list.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
        initial.current = false;
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setLoadError(
            cause instanceof Error ? cause.message : "Could not load reviews."
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [itemId, page, refresh, isPreview]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    const result = reviewSchema.safeParse({ name, rating, comment });
    if (!result.success) {
      setError(
        rating === 0
          ? lang === "am"
            ? "እባክዎ መጀመሪያ የኮከብ ደረጃ ይምረጡ።"
            : "Choose a star rating first."
          : result.error.issues[0].message
      );
      return;
    }
    locked.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/public/items/${encodeURIComponent(itemId)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.data),
        }
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Could not save your review.");
      setSuccess(
        lang === "am"
          ? "እናመሰግናለን! አስተያየትዎ እና ደረጃዎ ተመዝግቧል።"
          : "Thank you! Your rating and review are now posted."
      );
      setFormOpen(false);
      setComment("");
      setRating(0);
      setPage(1);
      load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save your review. Your text is still here."
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  return (
    <section
      ref={sectionRef}
      className={styles.reviews}
      aria-label="Dish ratings and reviews"
    >
      <div className={styles.reviewHeading}>
        <h3>{lang === "am" ? "ደረጃዎች እና አስተያየቶች" : "Ratings & Guest Reviews"}</h3>
        {!isPreview && (
          <button
            type="button"
            className={styles.writeReviewBtn}
            onClick={() => {
              setFormOpen(!formOpen);
              setSuccess("");
            }}
            aria-expanded={formOpen}
            aria-controls={`review-form-${itemId}`}
          >
            <MessageSquarePlus size={13} />
            <span>
              {formOpen
                ? lang === "am"
                  ? "ዝጋ"
                  : "Cancel"
                : lang === "am"
                ? "አስተያየት ይጻፉ"
                : "Write a review"}
            </span>
          </button>
        )}
      </div>
      {isPreview ? (
        <p className={styles.reviewMuted}>
          {lang === "am"
            ? "ምናሌው ሲታተም የእንግዶች አስተያየት እዚህ ይታያል።"
            : "Guest reviews are available once this menu is published."}
        </p>
      ) : (
        <>
          {data && (
            <div className={styles.ratingSummary}>
              <Star size={22} fill="currentColor" />
              <strong>
                {data.average == null ? "New" : data.average.toFixed(1)}
              </strong>
              <span>
                {data.total}{" "}
                {lang === "am"
                  ? "አስተያየቶች"
                  : data.total === 1
                  ? "verified guest review"
                  : "verified guest reviews"}
              </span>
            </div>
          )}
          {success && (
            <p role="status" className={styles.reviewSuccess}>
              {success}
            </p>
          )}
          {formOpen && (
            <form
              id={`review-form-${itemId}`}
              onSubmit={submit}
              className={styles.reviewForm}
            >
              <fieldset disabled={saving}>
                <legend>
                  {lang === "am" ? "ይህ ምግብ እንዴት ነበር?" : "How was this dish?"}
                </legend>
                <div
                  className={styles.ratingInput}
                  role="radiogroup"
                  aria-label="Your star rating"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} title={`${value} stars`}>
                      <input
                        type="radio"
                        name={`rating-${itemId}`}
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        aria-label={`${value} ${
                          value === 1 ? "star" : "stars"
                        }`}
                      />
                      <Star
                        size={28}
                        fill={rating >= value ? "currentColor" : "none"}
                      />
                      <span className={styles.srOnly}>{value} stars</span>
                    </label>
                  ))}
                </div>
                <label className={styles.reviewLabel}>
                  {lang === "am" ? "ስምዎ" : "Your display name"}
                  <input
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="nickname"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={lang === "am" ? "ለምሳሌ፦ ሃና" : "e.g. Hana"}
                  />
                </label>
                <label className={styles.reviewLabel}>
                  {lang === "am" ? "አስተያየትዎ" : "Your review"}
                  <textarea
                    required
                    minLength={5}
                    maxLength={1500}
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={
                      lang === "am"
                        ? "ስለ ምግቡ ጣዕም እና አቀራረብ ምን ወደዱ?"
                        : "What did you enjoy about the flavor or presentation?"
                    }
                  />
                </label>
                <p className={styles.reviewMuted}>
                  {lang === "am"
                    ? "ስምዎ እና አስተያየትዎ ለሌሎች እንግዶች ይታያል።"
                    : "Your name and review will be public. Submitting again updates your previous rating."}
                </p>
                {error && (
                  <p role="alert" className={styles.reviewError}>
                    {error}
                  </p>
                )}
                <button type="submit" className={styles.submitReview}>
                  {saving
                    ? lang === "am"
                      ? "በመላክ ላይ…"
                      : "Posting…"
                    : lang === "am"
                    ? "አስተያየት ላክ"
                    : "Post Review"}
                </button>
              </fieldset>
            </form>
          )}
          <div ref={list} aria-busy={loading}>
            {loading ? (
              <p role="status" className={styles.reviewMuted}>
                {lang === "am" ? "አስተያየቶችን በመጫን ላይ…" : "Loading reviews…"}
              </p>
            ) : loadError ? (
              <p role="alert" className={styles.reviewError}>
                {loadError}{" "}
                <button type="button" onClick={load}>
                  {lang === "am" ? "እንደገና ሞክር" : "Try again"}
                </button>
              </p>
            ) : data?.reviews.length ? (
              data.reviews.map((review) => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewByline}>
                    <strong>{review.name}</strong>
                    <span aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={12}
                          fill={review.rating >= value ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </article>
              ))
            ) : (
              <p className={styles.reviewMuted}>
                {lang === "am"
                  ? "ይህን ምግብ ቀምሰውታል? የመጀመሪያውን አስተያየት ያጋሩ።"
                  : "Tried this dish? Be the first to share your thoughts."}
              </p>
            )}
          </div>
          {data && data.pages > 1 && (
            <nav aria-label="Review pages" className={styles.reviewPagination}>
              <button
                type="button"
                aria-label="Previous review page"
                disabled={loading || data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                <ChevronLeft size={16} />{" "}
                {lang === "am" ? "ቀዳሚ" : "Previous"}
              </button>
              <span>
                {lang === "am"
                  ? `ገጽ ${data.page} ከ ${data.pages}`
                  : `Page ${data.page} of ${data.pages}`}
              </span>
              <button
                type="button"
                aria-label="Next review page"
                disabled={loading || data.page >= data.pages}
                onClick={() => setPage(data.page + 1)}
              >
                {lang === "am" ? "ቀጣይ" : "Next"} <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}


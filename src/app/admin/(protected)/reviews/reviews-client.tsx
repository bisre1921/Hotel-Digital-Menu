"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  Search,
  Trash2,
  Filter,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Utensils,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface MenuOption {
  id: string;
  title: string;
  slug: string;
}

interface ReviewEntry {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    imageUrl: string | null;
    category: {
      id: string;
      name: string;
      menu: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
}

export default function ReviewsClient({
  menus,
  userRole,
}: {
  menus: MenuOption[];
  userRole: string;
}) {
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [menuId, setMenuId] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [maxRating, setMaxRating] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Summary & Pagination
  const [summary, setSummary] = useState<{
    totalAllReviews: number;
    averageRating: number | null;
  }>({
    totalAllReviews: 0,
    averageRating: null,
  });
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const canModerate = userRole === "OWNER" || userRole === "MANAGER";

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (menuId) params.set("menuId", menuId);
      if (minRating) params.set("minRating", minRating);
      if (maxRating) params.set("maxRating", maxRating);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch guest reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
      if (data.summary) setSummary(data.summary);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [menuId, minRating, maxRating, search, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDeleteReview = async (id: string, guestName: string) => {
    if (!confirm(`Delete review from "${guestName}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete review");
      await fetchReviews();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            Guest Feedback & Culinary Sentiment
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Guest Dish Reviews
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            Monitor guest ratings across all dining venues and moderate public dish reviews.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold-500" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Property Average Rating
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl font-semibold text-foreground">
              {summary.averageRating !== null ? summary.averageRating.toFixed(1) : "—"}
            </span>
            <div className="flex items-center text-gold-500">
              <Star className="w-5 h-5 fill-gold-500 text-gold-500" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Out of 5.0 stars across all dishes</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Total Guest Reviews
          </div>
          <div className="font-serif text-3xl font-semibold text-foreground">
            {summary.totalAllReviews}
          </div>
          <div className="text-xs text-muted-foreground mt-1">All-time submitted dish reviews</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Filtered Results
          </div>
          <div className="font-serif text-3xl font-semibold text-foreground">
            {pagination.total}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Matching current filter criteria
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-500">
          <Filter className="w-3.5 h-3.5" /> Filter & Search Reviews
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest name or comment..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
            />
          </div>

          <select
            value={menuId}
            onChange={(e) => {
              setMenuId(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="">All Dining Menus</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="">Min Rating: Any</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Star</option>
          </select>

          <select
            value={maxRating}
            onChange={(e) => {
              setMaxRating(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="">Max Rating: Any</option>
            <option value="5">Up to 5 Stars</option>
            <option value="4">Up to 4 Stars</option>
            <option value="3">Up to 3 Stars (Critical)</option>
            <option value="2">Up to 2 Stars (Low)</option>
            <option value="1">1 Star Only</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 rounded-3xl bg-card border border-border text-center text-sm text-muted-foreground">
            Loading guest reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
            <div className="font-serif text-lg text-foreground">No Guest Reviews Found</div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Guests can rate and review individual dishes directly from the public QR digital menu.
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-gold-500/30 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-semibold text-sm text-foreground">{rev.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < rev.rating
                            ? "fill-gold-500 text-gold-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {rev.comment ? (
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs italic text-muted-foreground">Rating submitted without written comment.</p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-foreground font-medium">
                    <Utensils className="w-3 h-3 text-gold-500" />
                    {rev.item.name}
                  </span>
                  <span>•</span>
                  <span>{rev.item.category.name}</span>
                  <span>•</span>
                  <Link
                    href={`/admin/menus/${rev.item.category.menu.id}`}
                    className="text-gold-500 hover:underline font-medium"
                  >
                    {rev.item.category.menu.title}
                  </Link>
                </div>
              </div>

              {canModerate && (
                <button
                  type="button"
                  disabled={deletingId === rev.id}
                  onClick={() => handleDeleteReview(rev.id, rev.name)}
                  className="py-2 px-3 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 text-xs flex items-center gap-1.5 self-end sm:self-start transition-colors disabled:opacity-50"
                  title="Moderate / Delete Review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} reviews)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-40 text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-40 text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

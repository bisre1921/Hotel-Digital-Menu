"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  FileText,
  Plus,
  ScanLine,
  Search,
  Sparkles,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  extractedMenuSchema,
  importCommitSchema,
  type ImportRow,
} from "@/lib/menu-import";
import { ImportReviewItem } from "@/components/menu-import/import-review-item";

type Row = ImportRow & { id: string; checked: boolean };

const field =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const SAMPLE =
  "# Hot drinks\nCoffee | 80\nMacchiato | Small cup | 100\n# Breakfast\nEgg sandwich | 220\nፉል / Ful | 180";

function isRowValid(row: Pick<ImportRow, "name" | "category" | "price">): boolean {
  return (
    Boolean(row.name.trim()) &&
    Boolean(row.category.trim()) &&
    row.price !== null &&
    row.price >= 0 &&
    row.price <= 1000000
  );
}

function suggestMenuTitle(files: File[], items: ImportRow[]): string {
  if (files.length > 0) {
    const cleaned = files[0].name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 2 && !/^(img|dsc|photo|image|scan|screenshot)/i.test(cleaned)) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).slice(0, 80);
    }
  }
  const firstCat = items[0]?.category?.trim();
  if (firstCat && firstCat.toLowerCase() !== "menu") {
    return `${firstCat} Menu`.slice(0, 80);
  }
  return "Imported Menu";
}

export function MenuImportStudio({
  businessId,
  currency,
  visionEnabled,
}: {
  businessId: string;
  currency: string;
  visionEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [useAiText, setUseAiText] = useState(visionEnabled);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { url: string; name: string; sizeKb: number; pdf: boolean }[]
  >([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [showReference, setShowReference] = useState(true);

  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [importId, setImportId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<"extract" | "save" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

  // Filtering & search for compact listing
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "MISSING_PRICE" | "UNCHECKED">("ALL");

  const storageKey = `menu-import-v1:${businessId}`;
  const savingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        const parsed = extractedMenuSchema.safeParse({ items: data.rows });
        if (
          parsed.success &&
          typeof data.title === "string" &&
          typeof data.importId === "string"
        ) {
          const restoredRows = parsed.data.items.map((row) => ({
            ...row,
            id: crypto.randomUUID(),
            checked: isRowValid(row),
          }));
          setRows(restoredRows);
          setTitle(data.title.trim() || suggestMenuTitle([], parsed.data.items));
          setImportId(data.importId);
          setNotice(
            "Your draft review was restored. Verify any highlighted items and save when ready."
          );
        }
      }
    } catch {
      /* Storage may be disabled; the live review still works. */
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (rows.length)
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ rows, title, importId })
        );
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* Do not block review if browser storage is unavailable. */
    }
  }, [rows, title, importId, storageKey, ready]);

  useEffect(() => {
    const next = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      pdf: file.type === "application/pdf",
    }));
    setPreviews(next);
    setActivePreviewIdx(0);
    return () => next.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  function edit(id: string, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, ...patch };
        return {
          ...updated,
          checked: isRowValid(updated) ? updated.checked : false,
        };
      })
    );
  }

  async function extract() {
    setBusy("extract");
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      if (mode === "file") {
        files.forEach((file) => form.append("files", file));
      } else {
        form.append("text", text);
        if (useAiText && visionEnabled) form.append("useAi", "true");
      }
      const response = await fetch("/api/menu-import/extract", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not read the menu.");
      const parsed = extractedMenuSchema.parse(data);
      const nextRows = parsed.items.map((row) => ({
        ...row,
        id: crypto.randomUUID(),
        checked: isRowValid(row),
      }));
      setRows(nextRows);
      if (!title.trim()) {
        setTitle(suggestMenuTitle(files, parsed.items));
      }
      setImportId(crypto.randomUUID());
      setConfirmed(false);
      setActiveCategory("ALL");
      setStatusFilter("ALL");
      setSearchQuery("");
      const missingPrices = nextRows.filter((r) => r.price === null).length;
      setNotice(
        missingPrices > 0
          ? `Extracted ${nextRows.length} items (${missingPrices} need a price). Fill in missing prices and save your draft.`
          : `Extracted ${nextRows.length} items and auto-checked all valid rows. Confirm below to save your draft.`
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read the menu."
      );
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (savingRef.current) return;
    setError("");
    if (title.trim().length < 2) {
      setError("Please enter a menu name (at least 2 characters).");
      titleInputRef.current?.focus();
      return;
    }
    if (rows.some((row) => !isRowValid(row))) {
      setStatusFilter("MISSING_PRICE");
      setActiveCategory("ALL");
      setError("Please enter a valid name, category, and price for all items before saving.");
      return;
    }
    if (rows.some((row) => !row.checked)) {
      setStatusFilter("UNCHECKED");
      setActiveCategory("ALL");
      setError("Check all items (or click 'Check all valid') before saving.");
      return;
    }
    const result = importCommitSchema.safeParse({
      importId,
      title: title.trim(),
      reviewed: confirmed,
      items: rows,
    });
    if (!result.success) {
      setError("Enter a menu name, correct all prices, and confirm your review.");
      return;
    }
    savingRef.current = true;
    setBusy("save");
    try {
      const response = await fetch("/api/menu-import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save the draft.");
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* optional storage */
      }
      router.push(`/admin/menus/${data.menuId}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the draft."
      );
    } finally {
      savingRef.current = false;
      setBusy(null);
    }
  }

  const checkedCount = rows.filter((row) => row.checked).length;
  const missingCount = rows.filter((row) => !isRowValid(row)).length;
  const uncheckedCount = rows.length - checkedCount;
  const allRowsValid = rows.length > 0 && missingCount === 0;
  const canSave =
    !busy &&
    confirmed &&
    checkedCount === rows.length &&
    allRowsValid &&
    title.trim().length >= 2;

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const cat = row.category.trim() || "Uncategorized";
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries());
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (statusFilter === "MISSING_PRICE" && isRowValid(row)) return false;
        if (statusFilter === "UNCHECKED" && row.checked) return false;
        if (
          activeCategory !== "ALL" &&
          (row.category.trim() || "Uncategorized") !== activeCategory
        ) {
          return false;
        }
        if (q) {
          const hay = `${row.name} ${row.category} ${row.description}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [rows, searchQuery, activeCategory, statusFilter]);

  const currentPreview = previews[activePreviewIdx] || previews[0];

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/menus"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to menus
        </Link>
        <ol aria-label="Import progress" className="flex gap-4 text-xs font-medium">
          {["Add source", "Review & edit", "Save draft"].map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-2 ${
                i === (rows.length ? 1 : 0)
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-primary">
            From paper to your own menu
          </p>
          <h1 className="font-serif text-2xl leading-tight sm:text-3xl">
            {rows.length ? "Review & Save Imported Menu" : "Your menu. Less typing."}
          </h1>
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowReference((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showReference ? <EyeOff size={14} /> : <Eye size={14} />}
              {showReference ? "Hide source preview" : "Show source preview"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Discard this review and start a new import?"
                  )
                ) {
                  setRows([]);
                  setConfirmed(false);
                  setNotice("");
                  setError("");
                }
              }}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            >
              Start over
            </button>
          </div>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      )}

      {!rows.length ? (
        /* ================= STEP 1: UPLOAD OR PASTE SOURCE ================= */
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section aria-label="Original menu" className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div
                className="mb-5 flex gap-2"
                role="group"
                aria-label="Source type"
              >
                {(["file", "text"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      mode === value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {value === "file" ? "Photo or PDF" : "Paste text"}
                  </button>
                ))}
              </div>

              {mode === "file" ? (
                <>
                  <label className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-5 py-8 text-center transition-colors hover:bg-primary/10 focus-within:ring-2 focus-within:ring-primary">
                    <Upload className="text-primary" size={28} />
                    <span className="font-serif text-xl">
                      Bring your paper menu
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Choose up to 5 JPG, PNG, WebP or PDF files · 10 MB total
                    </span>
                    <input
                      aria-label="Upload original menu files"
                      className="mt-1 block w-full max-w-xs text-xs"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={!!busy}
                      onChange={(event) => {
                        const next = Array.from(event.target.files || []);
                        if (
                          next.length > 5 ||
                          next.reduce((sum, file) => sum + file.size, 0) >
                            10 * 1024 * 1024
                        ) {
                          setError(
                            "Choose up to 5 files, at most 10 MB total."
                          );
                          event.target.value = "";
                          return;
                        }
                        setError("");
                        setFiles(next);
                      }}
                    />
                  </label>

                  {/* Compact file thumbnail strip instead of giant full-height images */}
                  {previews.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {previews.length}{" "}
                          {previews.length === 1 ? "file" : "files"} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles([])}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {previews.map((preview, idx) => (
                          <div
                            key={preview.url}
                            className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2"
                          >
                            {preview.pdf ? (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                PDF
                              </div>
                            ) : (
                              <img
                                src={preview.url}
                                alt={preview.name}
                                className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {preview.name}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span>{preview.sizeKb} KB</span>
                                <span>·</span>
                                <a
                                  href={preview.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline"
                                >
                                  Preview
                                </a>
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${preview.name}`}
                              onClick={() =>
                                setFiles((curr) =>
                                  curr.filter((_, fileIdx) => fileIdx !== idx)
                                )
                              }
                              className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    By choosing Read my menu, you send these files to our AI
                    extraction provider. Upload menus you have permission to
                    use. Originals are not saved to the media library.
                  </p>
                  {!visionEnabled && (
                    <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                      Photo/PDF extraction needs administrator setup. You can
                      paste text to get started now.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label
                      htmlFor="menu-text"
                      className="block text-sm font-medium"
                    >
                      Menu text
                    </label>
                    {visionEnabled && (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary">
                        <input
                          type="checkbox"
                          checked={useAiText}
                          onChange={(e) => setUseAiText(e.target.checked)}
                          className="rounded accent-primary"
                        />
                        <Sparkles size={13} />
                        <span>AI Smart Parse (handles messy text)</span>
                      </label>
                    )}
                  </div>
                  <textarea
                    id="menu-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={30000}
                    rows={10}
                    placeholder={SAMPLE}
                    className={`${field} font-mono`}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {useAiText && visionEnabled
                      ? `Paste any copy-pasted menu text, WhatsApp message, or price list — Gemini AI will automatically organize categories, descriptions, and prices in ${currency}.`
                      : `Start categories with #. Use one item per line: Name | Description (optional) | Price. Keep all prices in ${currency}.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setText(SAMPLE)}
                    className="mt-2.5 text-xs font-medium text-primary underline underline-offset-4"
                  >
                    Try sample text
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={extract}
                disabled={
                  !!busy ||
                  (mode === "file"
                    ? !files.length || !visionEnabled
                    : !text.trim())
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-40"
              >
                <ScanLine size={18} />
                {busy === "extract" ? "Reading your menu…" : "Read my menu"}
              </button>
            </div>
          </section>

          <aside className="flex flex-col justify-between rounded-2xl bg-[#f4ebd9] p-6 text-[#232b25] sm:p-8">
            <div>
              <FileText size={30} strokeWidth={1.3} />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[.2em]">
                A little care, a better menu
              </p>
              <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
                We read it.
                <br />
                You make the final call.
              </h2>
              <p className="mt-4 text-sm leading-6">
                Names, categories and prices become compact editable rows.
                Missing prices are highlighted automatically, and your menu goes
                live only when you publish it.
              </p>
            </div>
            <ul className="mt-8 space-y-3 border-t border-[#232b25]/20 pt-5 text-sm">
              {[
                "Amharic and English text kept as printed",
                "Valid items auto-checked to save you time",
                "Saved as a draft, never published automatically",
              ].map((label) => (
                <li key={label} className="flex items-start gap-3">
                  <Check size={17} className="mt-0.5 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : (
        /* ================= STEP 2: COMPACT SIDE-BY-SIDE REVIEW ================= */
        <div
          className={`grid items-start gap-6 ${
            showReference
              ? "lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]"
              : "grid-cols-1"
          }`}
        >
          {/* LEFT COLUMN: Sticky, Bounded Source Preview */}
          {showReference && (
            <section
              aria-label="Original menu"
              className="min-w-0 rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-6"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Original Reference
                </p>
                {currentPreview && !currentPreview.pdf && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomed((z) => !z)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {zoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}
                      {zoomed ? "Fit view" : "Zoom"}
                    </button>
                    <a
                      href={currentPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-primary underline"
                    >
                      Open full
                    </a>
                  </div>
                )}
              </div>

              {/* Page tabs when multiple images/PDFs are uploaded */}
              {previews.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {previews.map((preview, i) => (
                    <button
                      key={preview.url}
                      type="button"
                      onClick={() => setActivePreviewIdx(i)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        activePreviewIdx === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Page {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Bounded Preview Container (never stretches page height) */}
              {currentPreview ? (
                <div className="overflow-auto rounded-xl border border-border bg-black/20 max-h-[52vh]">
                  {currentPreview.pdf ? (
                    <object
                      data={currentPreview.url}
                      type="application/pdf"
                      aria-label={`Original ${currentPreview.name}`}
                      className="h-[48vh] w-full"
                    >
                      <p className="p-4 text-xs text-muted-foreground">
                        <a
                          href={currentPreview.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Open the original PDF
                        </a>
                      </p>
                    </object>
                  ) : (
                    /* Constrained height by default, scrollable when zoomed */
                    <img
                      src={currentPreview.url}
                      alt={`Original menu page ${activePreviewIdx + 1}`}
                      className={
                        zoomed
                          ? "w-[160%] max-w-none cursor-zoom-out"
                          : "mx-auto max-h-[48vh] w-auto object-contain cursor-zoom-in"
                      }
                      onClick={() => setZoomed((z) => !z)}
                    />
                  )}
                </div>
              ) : text ? (
                <pre className="max-h-[48vh] overflow-auto rounded-xl border border-border bg-background/60 p-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
                  {text}
                </pre>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Original files stay in your browser and are not stored after
                    a page refresh.
                  </p>
                  <label className="mt-2 inline-block cursor-pointer text-xs font-medium text-primary underline">
                    Re-attach reference image/PDF
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        setFiles(Array.from(e.target.files || []).slice(0, 5))
                      }
                    />
                  </label>
                </div>
              )}
            </section>
          )}

          {/* RIGHT COLUMN: Menu Title, Compact Filter Toolbar, Bounded Item List, & Save Bar */}
          <section
            className="min-w-0 space-y-4"
            aria-label="Review extracted items"
          >
            {/* Top Bar: Menu Name + Summary + Bulk Check */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label
                    htmlFor="import-title"
                    className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    <span>Menu Name (Required)</span>
                    {title.trim().length < 2 && (
                      <span className="text-amber-500 font-normal normal-case">
                        * Enter at least 2 characters
                      </span>
                    )}
                  </label>
                  <input
                    ref={titleInputRef}
                    id="import-title"
                    value={title}
                    maxLength={120}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. All-Day Dining Menu"
                    className={`${field} ${
                      title.trim().length < 2
                        ? "border-amber-500/70 ring-1 ring-amber-500/30"
                        : ""
                    }`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {checkedCount < rows.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRows((current) =>
                          current.map((row) =>
                            isRowValid(row) ? { ...row, checked: true } : row
                          )
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <CheckCheck size={14} /> Check all valid ({rows.length - missingCount})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRows((current) =>
                          current.map((row) => ({ ...row, checked: false }))
                        );
                        setConfirmed(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Uncheck all
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={rows.length >= 200 || !!busy}
                    onClick={() => {
                      const defaultCat =
                        activeCategory !== "ALL"
                          ? activeCategory
                          : rows.at(-1)?.category || "Menu";
                      setRows((current) => [
                        {
                          id: crypto.randomUUID(),
                          category: defaultCat,
                          name: "",
                          price: null,
                          description: "",
                          note: "Enter item name and price",
                          checked: false,
                        },
                        ...current,
                      ]);
                      setConfirmed(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40"
                  >
                    <Plus size={14} /> Add item
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === "ALL"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({rows.length})
                  </button>
                  {missingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("MISSING_PRICE")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        statusFilter === "MISSING_PRICE"
                          ? "bg-amber-500 text-black"
                          : "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                      }`}
                    >
                      Needs Price ({missingCount})
                    </button>
                  )}
                  {uncheckedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("UNCHECKED")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        statusFilter === "UNCHECKED"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Unchecked ({uncheckedCount})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dish or category…"
                    className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Category quick-jump pills when multiple categories exist */}
              {categories.length > 1 && (
                <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("ALL")}
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                      activeCategory === "ALL"
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All categories ({categories.length})
                  </button>
                  {categories.map(([cat, count]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                        activeCategory === cat
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  ))}
                </div>
              )}

              <progress
                aria-label="Items reviewed"
                value={checkedCount}
                max={rows.length}
                className="mt-2.5 h-1 w-full accent-primary"
              />
            </div>

            {/* Bounded Scrollable Items Container — prevents 10,000px long pages */}
            <div className="max-h-[54vh] space-y-2 overflow-y-auto rounded-2xl border border-border bg-card/40 p-2.5 sm:p-3">
              {filteredRows.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No items match the current filter.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setActiveCategory("ALL");
                      setSearchQuery("");
                    }}
                    className="text-primary underline"
                  >
                    Show all {rows.length} items
                  </button>
                </div>
              ) : (
                filteredRows.map(({ row, index }) => (
                  <ImportReviewItem
                    key={row.id}
                    row={row}
                    index={index}
                    currency={currency}
                    busy={!!busy}
                    onEdit={edit}
                    onRemove={(id) => {
                      setRows((current) =>
                        current.filter((item) => item.id !== id)
                      );
                    }}
                    onCheck={(id, checked) => {
                      setRows((current) =>
                        current.map((item) =>
                          item.id === id ? { ...item, checked } : item
                        )
                      );
                      if (!checked) setConfirmed(false);
                    }}
                  />
                ))
              )}
            </div>

            {/* Bottom Save Card — Always clear why Save is enabled or what's left */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              {/* Actionable blocker hints if anything is missing */}
              {(title.trim().length < 2 || missingCount > 0) && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                    <span>
                      {missingCount > 0
                        ? `${missingCount} ${
                            missingCount === 1 ? "item is" : "items are"
                          } missing a valid price or name.`
                        : "Enter a Menu Name (at least 2 characters) to enable saving."}
                    </span>
                    {missingCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("MISSING_PRICE");
                          setActiveCategory("ALL");
                        }}
                        className="font-semibold underline"
                      >
                        Show {missingCount} incomplete{" "}
                        {missingCount === 1 ? "item" : "items"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => titleInputRef.current?.focus()}
                        className="font-semibold underline"
                      >
                        Enter menu name
                      </button>
                    )}
                  </div>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={!allRowsValid}
                  onChange={(e) => {
                    const nextChecked = e.target.checked;
                    if (nextChecked) {
                      // Automatically mark all valid rows as checked when confirming review
                      setRows((current) =>
                        current.map((row) =>
                          isRowValid(row) ? { ...row, checked: true } : row
                        )
                      );
                    }
                    setConfirmed(nextChecked);
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  I have reviewed every item, price and category. All prices use{" "}
                  <strong>{currency}</strong>. Save these as a new unpublished
                  menu.
                </span>
              </label>

              <button
                type="button"
                onClick={save}
                disabled={!canSave}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
              >
                {busy === "save" ? "Saving your draft…" : "Save reviewed draft"}
                <ArrowRight size={17} />
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {!canSave && confirmed && title.trim().length < 2
                  ? "Almost ready — enter a Menu Name at the top to save."
                  : "Next: preview your menu and publish when you’re ready."}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

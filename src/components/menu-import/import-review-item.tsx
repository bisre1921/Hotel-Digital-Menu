"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { ImportRow } from "@/lib/menu-import";

export type ReviewRow = ImportRow & { id: string; checked: boolean };

const compactInput =
  "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export function ImportReviewItem({
  row,
  index,
  currency,
  busy = false,
  readOnly = false,
  onEdit,
  onRemove,
  onCheck,
}: {
  row: ReviewRow;
  index: number;
  currency: string;
  busy?: boolean;
  readOnly?: boolean;
  onEdit: (id: string, patch: Partial<ReviewRow>) => void;
  onRemove: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
}) {
  const [showDetails, setShowDetails] = useState(() => Boolean(row.description));
  const isValid =
    Boolean(row.name.trim()) &&
    Boolean(row.category.trim()) &&
    row.price !== null &&
    row.price >= 0 &&
    row.price <= 1000000;

  return (
    <article
      className={`rounded-xl border bg-card px-3 py-2.5 transition-colors ${
        row.price === null
          ? "border-amber-500/60 bg-amber-500/[0.03]"
          : row.checked
            ? "border-emerald-600/35"
            : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {/* Check item toggle */}
        <label
          title={
            isValid
              ? "Mark item as reviewed"
              : "Enter item name, category, and price first"
          }
          className="flex shrink-0 cursor-pointer items-center gap-1.5"
        >
          <input
            type="checkbox"
            aria-label={`Confirm ${row.name || `item ${index + 1}`}`}
            checked={row.checked}
            disabled={readOnly || !isValid}
            onChange={(e) => onCheck(row.id, e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="w-6 font-mono text-[11px] text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
        </label>

        {/* Item Name */}
        <div className="min-w-[140px] flex-1">
          <input
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            aria-label="Item name"
            placeholder="Dish name"
            value={row.name}
            maxLength={200}
            onChange={(e) => onEdit(row.id, { name: e.target.value })}
            className={`${compactInput} font-medium`}
          />
        </div>

        {/* Category */}
        <div className="w-[46%] sm:w-36 shrink-0">
          <input
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            aria-label="Category"
            placeholder="Category"
            value={row.category}
            maxLength={100}
            onChange={(e) => onEdit(row.id, { category: e.target.value })}
            className={`${compactInput} text-xs text-muted-foreground focus:text-foreground`}
          />
        </div>

        {/* Price */}
        <div className=" relative w-[46%] sm:w-28 shrink-0">
          <input
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            aria-label={`Price in ${currency}`}
            placeholder={currency}
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            inputMode="decimal"
            value={row.price ?? ""}
            onChange={(e) =>
              onEdit(row.id, {
                price: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className={`${compactInput} pr-9 font-mono ${
              row.price === null ? "border-amber-500/70 bg-amber-500/10" : ""
            }`}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
            {currency}
          </span>
        </div>

        {/* Actions: toggle description & delete */}
        {!readOnly && (
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              title={showDetails ? "Hide description" : "Edit description"}
              className={`rounded-lg px-2 py-1.5 text-xs transition-colors ${
                row.description
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              type="button"
              aria-label={`Remove ${row.name || `item ${index + 1}`}`}
              disabled={!!busy}
              onClick={() => onRemove(row.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Collapsible or readOnly description */}
      {(showDetails || (readOnly && row.description)) && (
        <div className="mt-2 pl-7">
          <input
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            aria-label="Description"
            placeholder="Optional ingredients or short description…"
            value={row.description}
            maxLength={2000}
            onChange={(e) => onEdit(row.id, { description: e.target.value })}
            className={`${compactInput} text-xs text-muted-foreground focus:text-foreground`}
          />
        </div>
      )}

      {/* Show warning note only when price is missing or an explicit AI uncertainty note exists */}
      {row.price === null && (
        <p className="mt-1.5 flex items-center gap-1.5 pl-7 text-[11px] font-medium text-amber-500">
          <AlertCircle size={12} className="shrink-0" />
          <span>{row.note || "Price missing — enter price from the original menu."}</span>
        </p>
      )}
    </article>
  );
}

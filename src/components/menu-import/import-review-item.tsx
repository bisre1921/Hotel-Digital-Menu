"use client";
import { Trash2 } from "lucide-react";
import type { ImportRow } from "@/lib/menu-import";
export type ReviewRow = ImportRow & { id: string; checked: boolean };
const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
export function ImportReviewItem({ row, index, currency, busy = false, readOnly = false, onEdit, onRemove, onCheck }: { row: ReviewRow; index: number; currency: string; busy?: boolean; readOnly?: boolean; onEdit: (id: string, patch: Partial<ReviewRow>) => void; onRemove: (id: string) => void; onCheck: (id: string, checked: boolean) => void }) {
return <article key={row.id} className={`rounded-2xl border bg-card p-4 sm:p-5 ${row.checked ? "border-emerald-600/40" : row.price === null ? "border-amber-500/60" : "border-border"}`}>
          <div className="mb-4 flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">ITEM {String(index + 1).padStart(2, "0")}</span>{!readOnly && <button type="button" aria-label={`Remove ${row.name || `item ${index + 1}`}`} disabled={!!busy} onClick={() => onRemove(row.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button>}</div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <label className="text-xs text-muted-foreground">Item name<input readOnly={readOnly} tabIndex={readOnly ? -1 : undefined} value={row.name} maxLength={200} onChange={(e) => onEdit(row.id, { name: e.target.value })} className={`${field} mt-1`} /></label>
            <label className="text-xs text-muted-foreground">Price · {currency}<input readOnly={readOnly} tabIndex={readOnly ? -1 : undefined} type="number" min="0" max="1000000" step="0.01" inputMode="decimal" value={row.price ?? ""} onChange={(e) => onEdit(row.id, { price: e.target.value === "" ? null : Number(e.target.value) })} className={`${field} mt-1`} /></label>
            <label className="text-xs text-muted-foreground">Category<input readOnly={readOnly} tabIndex={readOnly ? -1 : undefined} value={row.category} maxLength={100} onChange={(e) => onEdit(row.id, { category: e.target.value })} className={`${field} mt-1`} /></label>
            <label className="text-xs text-muted-foreground sm:col-span-2">Description<textarea readOnly={readOnly} tabIndex={readOnly ? -1 : undefined} rows={2} value={row.description} maxLength={2000} onChange={(e) => onEdit(row.id, { description: e.target.value })} className={`${field} mt-1`} /></label>
          </div>
          {row.note && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{row.note}</p>}
          <label className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm"><input type="checkbox" checked={row.checked} disabled={readOnly || !row.name.trim() || !row.category.trim() || row.price === null || row.price < 0 || row.price > 1000000} onChange={(e) => onCheck(row.id, e.target.checked)} className="h-4 w-4 accent-primary" />I checked this item and its price</label>
        </article>;
}

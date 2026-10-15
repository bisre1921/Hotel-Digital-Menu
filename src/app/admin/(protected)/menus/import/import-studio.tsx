"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, Plus, ScanLine, Upload } from "lucide-react";
import { extractedMenuSchema, importCommitSchema, type ImportRow } from "@/lib/menu-import";

type Row = ImportRow & { id: string; checked: boolean };
import { ImportReviewItem } from "@/components/menu-import/import-review-item";
const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const SAMPLE = "# Hot drinks\nCoffee | 80\nMacchiato | Small cup | 100\n# Breakfast\nEgg sandwich | 220\nፉል / Ful | 180";

export function MenuImportStudio({ businessId, currency, visionEnabled }: { businessId: string; currency: string; visionEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; name: string; pdf: boolean }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [importId, setImportId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<"extract" | "save" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const storageKey = `menu-import-v1:${businessId}`;
  const savingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        const parsed = extractedMenuSchema.safeParse({ items: data.rows });
        if (parsed.success && typeof data.title === "string" && typeof data.importId === "string") {
          setRows(parsed.data.items.map((row) => ({ ...row, id: crypto.randomUUID(), checked: false })));
          setTitle(data.title); setImportId(data.importId);
          setNotice("Your review was restored. Reattach the original if needed and check each row again.");
        }
      }
    } catch { /* Storage may be disabled; the live review still works. */ }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (rows.length) sessionStorage.setItem(storageKey, JSON.stringify({ rows, title, importId }));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Do not block review if browser storage is unavailable. */ }
  }, [rows, title, importId, storageKey, ready]);

  useEffect(() => {
    const next = files.map((file) => ({ url: URL.createObjectURL(file), name: file.name, pdf: file.type === "application/pdf" }));
    setPreviews(next);
    return () => next.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  function edit(id: string, patch: Partial<Row>) {
    setConfirmed(false);
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch, checked: false } : row));
  }

  async function extract() {
    setBusy("extract"); setError(""); setNotice("");
    try {
      const form = new FormData();
      if (mode === "file") files.forEach((file) => form.append("files", file));
      else form.append("text", text);
      const response = await fetch("/api/menu-import/extract", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read the menu.");
      const parsed = extractedMenuSchema.parse(data);
      setRows(parsed.items.map((row) => ({ ...row, id: crypto.randomUUID(), checked: false })));
      setImportId(crypto.randomUUID()); setConfirmed(false);
      setNotice("Extraction ready. Compare every item and price with the original before approving.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read the menu."); }
    finally { setBusy(null); }
  }

  async function save() {
    if (savingRef.current) return;
    setError("");
    if (rows.some((row) => !row.checked)) { setError("Check every item before saving."); return; }
    const result = importCommitSchema.safeParse({ importId, title, reviewed: confirmed, items: rows });
    if (!result.success) { setError("Enter a menu name, correct all prices, and confirm your review."); return; }
    savingRef.current = true; setBusy("save");
    try {
      const response = await fetch("/api/menu-import/commit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.data),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the draft.");
      try { sessionStorage.removeItem(storageKey); } catch { /* optional storage */ }
      router.push(`/admin/menus/${data.menuId}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the draft."); }
    finally { savingRef.current = false; setBusy(null); }
  }

  const checkedCount = rows.filter((row) => row.checked).length;
  const missingCount = rows.filter((row) => row.price === null).length;
  return <div className="space-y-7 pb-20">
    <Link href="/admin/menus" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to menus</Link>
    <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.22em] text-primary">From paper to your own menu</p>
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Your menu. Less typing.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Bring the menu you already have. Check the details, then save a draft you can make your own.</p>
      </div>
      <ol aria-label="Import progress" className="flex gap-4 text-xs font-medium">
        {["Add source", "Review", "Save draft"].map((label, i) => <li key={label} className={`flex items-center gap-2 ${i === (rows.length ? 1 : 0) ? "text-foreground" : "text-muted-foreground"}`}><span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">{i + 1}</span>{label}</li>)}
      </ol>
    </header>
    {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">{notice}</p>}
    <div className={`grid gap-7 ${rows.length ? "lg:grid-cols-[minmax(260px,.8fr)_minmax(0,1.5fr)]" : "lg:grid-cols-[1.2fr_1fr]"}`}>
      <section aria-label="Original menu" className="min-w-0 space-y-5">
        {!rows.length ? <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-6 flex gap-2" role="group" aria-label="Source type">
            {(["file", "text"] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium ${mode === value ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{value === "file" ? "Photo or PDF" : "Paste text"}</button>)}
          </div>
          {mode === "file" ? <>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-5 py-10 text-center focus-within:ring-2 focus-within:ring-primary">
              <Upload className="text-primary" size={30} />
              <span className="font-serif text-2xl">Bring your paper menu</span>
              <span className="text-xs text-muted-foreground">Choose up to 5 JPG, PNG, WebP or PDF files · 10 MB total</span>
              <input aria-label="Upload original menu files" className="mt-2 block w-full max-w-xs text-xs" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!!busy} onChange={(event) => {
                const next = Array.from(event.target.files || []);
                if (next.length > 5 || next.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) { setError("Choose up to 5 files, at most 10 MB total."); event.target.value = ""; return; }
                setError(""); setFiles(next);
              }} />
            </label>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">By choosing Read my menu, you send these files to our AI extraction provider. Upload menus you have permission to use. Originals are not saved to the media library.</p>
            {!visionEnabled && <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">Photo/PDF extraction needs administrator setup. You can paste text to get started now.</p>}
          </> : <>
            <label htmlFor="menu-text" className="mb-2 block text-sm font-medium">Menu text</label>
            <textarea id="menu-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={30000} rows={12} placeholder={SAMPLE} className={`${field} font-mono`} />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Start categories with #. Use one item per line: Name | Description (optional) | Price. Keep all prices in {currency}.</p>
            <button type="button" onClick={() => setText(SAMPLE)} className="mt-3 text-sm text-primary underline underline-offset-4">Try sample text</button>
          </>}
          <button type="button" onClick={extract} disabled={!!busy || (mode === "file" ? !files.length || !visionEnabled : !text.trim())} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-40"><ScanLine size={18} />{busy === "extract" ? "Reading your menu…" : "Read my menu"}</button>
        </div> : <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Original reference</p>
          {previews.length === 0 && text && <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</pre>}
          {previews.length === 0 && !text && <p className="text-sm text-muted-foreground">Original files stay in your browser and are not restored after a refresh.</p>}
          <label className="mt-4 block text-xs text-muted-foreground">Attach a reference without extracting again<input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 w-full" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} /></label>
          <button type="button" disabled={!!busy} onClick={() => { if (window.confirm("Discard this review and start a new import?")) { setRows([]); setConfirmed(false); setNotice(""); } }} className="mt-5 text-sm text-muted-foreground underline underline-offset-4">Start a new import</button>
        </div>}
        {previews.map((preview, i) => <div key={preview.url} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 p-3 text-xs"><span className="truncate">{i + 1}. {preview.name}</span><a href={preview.url} target="_blank" rel="noreferrer" className="shrink-0 text-primary underline">Open original</a></div>
          {preview.pdf ? <object data={preview.url} type="application/pdf" aria-label={`Original ${preview.name}`} className="h-96 w-full"><p className="p-4 text-sm">Open the original PDF using the link above.</p></object> : /* Local temporary previews need no remote optimization. */ <img src={preview.url} alt={`Original menu page ${i + 1}`} className="h-auto w-full" />}
        </div>)}
      </section>
      {!rows.length ? <aside className="flex flex-col justify-between rounded-2xl bg-[#f4ebd9] p-7 text-[#232b25] sm:p-10">
        <div><FileText size={32} strokeWidth={1.3} /><p className="mt-7 text-xs font-semibold uppercase tracking-[.2em]">A little care, a better menu</p><h2 className="mt-3 font-serif text-3xl leading-tight">We read it.<br />You make the final call.</h2><p className="mt-5 text-sm leading-7">Names, categories and prices become editable rows. Missing prices stay empty. Your menu goes live only when you publish it.</p></div>
        <ul className="mt-10 space-y-4 border-t border-[#232b25]/20 pt-6 text-sm">{["Amharic and English text kept as printed", "Unclear details flagged for your review", "Saved as a draft, never published automatically"].map((label) => <li key={label} className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0" />{label}</li>)}</ul>
      </aside> : <section className="min-w-0 space-y-5" aria-label="Review extracted items">
        <div className="rounded-2xl border border-border bg-card p-5">
          <label htmlFor="import-title" className="mb-2 block text-sm font-medium">Name your menu</label>
          <input id="import-title" value={title} maxLength={120} onChange={(e) => { setTitle(e.target.value); setConfirmed(false); }} placeholder="e.g. All-day cafe menu" className={field} />
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{rows.length} items · {checkedCount} checked</span><span>{missingCount ? `${missingCount} missing prices` : `Prices in ${currency}`}</span></div>
          <progress aria-label="Items reviewed" value={checkedCount} max={rows.length} className="mt-3 h-1.5 w-full accent-primary" />
        </div>
        {rows.map((row, index) => <ImportReviewItem key={row.id} row={row} index={index} currency={currency} busy={!!busy} onEdit={edit} onRemove={(id) => { setRows(current => current.filter(item => item.id !== id)); setConfirmed(false); }} onCheck={(id, checked) => { setRows(current => current.map(item => item.id === id ? { ...item, checked } : item)); setConfirmed(false); }} />)}
        <button type="button" disabled={rows.length >= 200 || !!busy} onClick={() => { setRows((current) => [...current, { id: crypto.randomUUID(), category: current.at(-1)?.category || "Menu", name: "", price: null, description: "", note: "", checked: false }]); setConfirmed(false); }} className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm"><Plus size={16} /> Add a missed item</button>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={confirmed} disabled={checkedCount !== rows.length || !rows.length} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-primary" />I have reviewed every item, price and category. All prices use {currency}. Save these as a new unpublished menu.</label>
          <button type="button" onClick={save} disabled={!!busy || !confirmed || checkedCount !== rows.length || title.trim().length < 2} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-40">{busy === "save" ? "Saving your draft…" : "Save reviewed draft"}<ArrowRight size={17} /></button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Next: preview your menu and publish when you’re ready.</p>
        </div>
      </section>}
    </div>
  </div>;
}

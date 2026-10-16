"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import {
  detectMediaKind,
  DishMatchResult,
  MatchableDish,
  matchMediaFilesToDishes,
  MediaKind,
} from "@/lib/media-matcher";

export interface LocalMediaAttachment {
  dishId: string;
  mediaKind: MediaKind;
  file: File;
  previewUrl: string;
}

export interface RemoteMediaAssignment {
  itemId: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface BatchFileEntry {
  id: string;
  file: File;
  previewUrl: string;
  mediaKind: MediaKind;
  match: DishMatchResult;
  selectedDishId: string;
}

interface BatchMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishes: MatchableDish[];
  /** Used in MenuImportStudio to attach matched files locally before final draft commit */
  onApplyLocal?: (attachments: LocalMediaAttachment[]) => void;
  /** Used in MenuEditor to upload matched files and persist them to existing dishes */
  onApplyRemote?: (assignments: RemoteMediaAssignment[]) => Promise<void>;
}

export function BatchMediaModal({
  isOpen,
  onClose,
  dishes,
  onApplyLocal,
  onApplyRemote,
}: BatchMediaModalProps) {
  const [entries, setEntries] = useState<BatchFileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setUploadProgress(null);
      setUploading(false);
    }
  }, [isOpen]);

  const handleFilesSelected = (selectedFiles: FileList | File[]) => {
    const incoming = Array.from(selectedFiles);
    if (incoming.length === 0) return;
    setError(null);

    const candidates = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      mimeType: file.type,
    }));

    const results = matchMediaFilesToDishes(
      candidates.map((c) => ({
        id: c.id,
        filename: c.filename,
        mimeType: c.mimeType,
      })),
      dishes
    );

    const resultMap = new Map(results.map((r) => [r.fileId, r]));

    const newEntries: BatchFileEntry[] = candidates.map((c) => {
      const match = resultMap.get(c.id)!;
      const mediaKind = detectMediaKind(c.filename, c.mimeType);
      return {
        id: c.id,
        file: c.file,
        previewUrl: URL.createObjectURL(c.file),
        mediaKind,
        match,
        selectedDishId: match.matchedDishId || "",
      };
    });

    setEntries((prev) => [...prev, ...newEntries]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target && !onApplyLocal) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((e) => e.id !== id);
    });
  };

  const clearAll = () => {
    if (!onApplyLocal) {
      entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    }
    setEntries([]);
    setError(null);
  };

  const activeSelections = useMemo(
    () => entries.filter((e) => Boolean(e.selectedDishId)),
    [entries]
  );

  const matchedImagesCount = useMemo(
    () => activeSelections.filter((e) => e.mediaKind === "image").length,
    [activeSelections]
  );

  const matchedVideosCount = useMemo(
    () => activeSelections.filter((e) => e.mediaKind === "video").length,
    [activeSelections]
  );

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (activeSelections.length === 0) {
      setError("Please match at least one photo or video to a dish.");
      return;
    }

    setError(null);

    // Mode 1: Local attachment (MenuImportStudio review step)
    if (onApplyLocal) {
      onApplyLocal(
        activeSelections.map((entry) => ({
          dishId: entry.selectedDishId,
          mediaKind: entry.mediaKind,
          file: entry.file,
          previewUrl: entry.previewUrl,
        }))
      );
      setEntries([]);
      onClose();
      return;
    }

    // Mode 2: Upload & save to DB (MenuEditor)
    if (onApplyRemote) {
      setUploading(true);
      setUploadProgress({ done: 0, total: activeSelections.length });

      try {
        const byItem = new Map<
          string,
          { itemId: string; imageUrl?: string; videoUrl?: string }
        >();

        for (let i = 0; i < activeSelections.length; i++) {
          const entry = activeSelections[i];
          const form = new FormData();
          form.append("file", entry.file, entry.file.name);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          if (!res.ok || !data?.url) {
            throw new Error(
              data?.error || `Failed to upload "${entry.file.name}"`
            );
          }

          const existing = byItem.get(entry.selectedDishId) || {
            itemId: entry.selectedDishId,
          };
          if (entry.mediaKind === "video" || data.type === "video") {
            existing.videoUrl = data.url;
          } else {
            existing.imageUrl = data.url;
          }
          byItem.set(entry.selectedDishId, existing);

          setUploadProgress({ done: i + 1, total: activeSelections.length });
        }

        await onApplyRemote(Array.from(byItem.values()));
        entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
        setEntries([]);
        onClose();
      } catch (err: any) {
        setError(err?.message || "Failed to upload and assign media.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-media-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Wand2 className="h-4 w-4" />
              </span>
              <h2
                id="batch-media-modal-title"
                className="font-serif text-xl font-medium text-foreground"
              >
                Smart Batch Photo &amp; Video Matcher
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Drop named dish photos or videos — we automatically match{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                firfirtibs.jpg
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                firfir-tibs.png
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                frfrtbs.img
              </code>
              , or{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                firfir_tibs.mp4
              </code>{" "}
              to <strong>Firfir Tibs</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (uploading) return;
              handleFilesSelected(e.dataTransfer.files);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/35 bg-primary/[0.03] px-4 py-5 text-center transition-colors hover:border-primary/60"
          >
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Upload className="h-5 w-5" />
              <Film className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Select or drag &amp; drop a batch of named dish photos &amp; videos
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Supports JPG, PNG, WebP, AVIF, GIF, .IMG, MP4, WebM, and MOV across{" "}
              {dishes.length} menu {dishes.length === 1 ? "dish" : "dishes"}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Choose Photos &amp; Videos
              </button>
              {entries.length > 0 && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Clear all ({entries.length})
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.img,.jpg,.jpeg,.png,.webp,.avif,.gif,.mp4,.webm,.mov"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesSelected(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          {/* Match List */}
          {entries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Uploaded Files ({entries.length}) — Matched:{" "}
                  <strong className="text-foreground">
                    {activeSelections.length}
                  </strong>{" "}
                  ({matchedImagesCount} photos, {matchedVideosCount} videos)
                </span>
                <span>You can reassign any dish on the right</span>
              </div>

              <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-background/40 p-2.5">
                {entries.map((entry) => {
                  const confidenceBadge =
                    entry.match.confidence === "high"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : entry.match.confidence === "medium"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                        : entry.match.confidence === "low"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : "border-border bg-muted text-muted-foreground";

                  return (
                    <div
                      key={entry.id}
                      className={`flex flex-col gap-2.5 rounded-xl border p-2.5 sm:flex-row sm:items-center sm:justify-between ${
                        entry.selectedDishId
                          ? "border-primary/35 bg-card"
                          : "border-border bg-card/50 opacity-80"
                      }`}
                    >
                      {/* Left: Preview + Filename + Match Reason */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-black/30">
                          {entry.mediaKind === "video" ? (
                            <video
                              src={entry.previewUrl}
                              muted
                              playsInline
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={entry.previewUrl}
                              alt={entry.file.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                            {entry.mediaKind === "video" ? "VID" : "IMG"}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {entry.mediaKind === "video" ? (
                              <Film className="h-3.5 w-3.5 shrink-0 text-primary" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                            )}
                            <p className="truncate text-xs font-semibold text-foreground">
                              {entry.file.name}
                            </p>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceBadge}`}
                            >
                              {entry.match.confidence === "none"
                                ? "Unmatched"
                                : `${entry.match.matchReason} (${Math.round(
                                    entry.match.score * 100
                                  )}%)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Dish Selector Dropdown + Remove */}
                      <div className="flex items-center gap-2 sm:w-72 shrink-0">
                        <select
                          aria-label={`Target dish for ${entry.file.name}`}
                          value={entry.selectedDishId}
                          disabled={uploading}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEntries((prev) =>
                              prev.map((item) =>
                                item.id === entry.id
                                  ? { ...item, selectedDishId: val }
                                  : item
                              )
                            );
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">— Skip / Do not assign —</option>
                          {dishes.map((dish) => (
                            <option key={dish.id} value={dish.id}>
                              {dish.name}
                              {dish.categoryName ? ` (${dish.categoryName})` : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          disabled={uploading}
                          aria-label={`Remove ${entry.file.name}`}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3.5">
          <div className="text-xs text-muted-foreground">
            {uploadProgress ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading {uploadProgress.done} of {uploadProgress.total} files…
              </span>
            ) : activeSelections.length > 0 ? (
              <span>
                Ready to assign{" "}
                <strong className="text-foreground">
                  {activeSelections.length}
                </strong>{" "}
                matched {activeSelections.length === 1 ? "file" : "files"}.
              </span>
            ) : (
              <span>Drop named dish images or videos above to begin.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={uploading || activeSelections.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Media…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Apply Matched Media ({activeSelections.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

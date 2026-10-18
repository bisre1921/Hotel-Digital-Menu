"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, Trash2, Save, Download, FileJson, Clock, Star } from "lucide-react";
import { slugify } from "@/lib/utils";

const DAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

interface MenuSettingsProps {
  menu: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    headerImageUrl?: string | null;
    isPublished: boolean;
    isDefault?: boolean;
    activeStartTime?: string | null;
    activeEndTime?: string | null;
    activeDays?: number[];
    displayLayout: "GRID" | "LIST" | "CARDS" | "MAGAZINE" | "TABLE";
  };
  onUpdate: (updatedMenu: any) => void;
}

const TIME_PRESETS = [
  { label: "All Day", start: "", end: "" },
  { label: "Breakfast (06:30–11:00)", start: "06:30", end: "11:00" },
  { label: "Lunch (11:30–16:00)", start: "11:30", end: "16:00" },
  { label: "Dinner (17:30–23:00)", start: "17:30", end: "23:00" },
];

export function MenuSettings({ menu, onUpdate }: MenuSettingsProps) {
  const router = useRouter();
  const [title, setTitle] = useState(menu.title);
  const [slug, setSlug] = useState(menu.slug);
  const [description, setDescription] = useState(menu.description || "");
  const [headerImageUrl, setHeaderImageUrl] = useState(menu.headerImageUrl || "");
  const [displayLayout, setDisplayLayout] = useState<"GRID" | "LIST" | "CARDS" | "MAGAZINE" | "TABLE">(
    menu.displayLayout || "CARDS"
  );
  const [isPublished, setIsPublished] = useState(menu.isPublished);
  const [isDefault, setIsDefault] = useState(Boolean(menu.isDefault));
  const [activeStartTime, setActiveStartTime] = useState(menu.activeStartTime || "");
  const [activeEndTime, setActiveEndTime] = useState(menu.activeEndTime || "");
  const [activeDays, setActiveDays] = useState<number[]>(menu.activeDays || []);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const toggleDay = (day: number) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setHeaderImageUrl(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          headerImageUrl: headerImageUrl || null,
          displayLayout,
          isPublished,
          isDefault,
          activeStartTime: activeStartTime || null,
          activeEndTime: activeEndTime || null,
          activeDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update menu settings");
      }

      onUpdate(data.menu);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this menu?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/menus");
        router.refresh();
      }
    } catch {
      alert("Failed to delete menu");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-subtle space-y-6">
        <div>
          <h3 className="font-serif text-xl font-medium text-foreground">Menu Outlet Configuration</h3>
          <p className="text-xs text-muted-foreground mt-1 font-light">
            Update header presentation, publishing availability, time-of-day scheduling, and URL routing.
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Menu settings updated successfully!
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Menu Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            URL Slug
          </label>
          <div className="flex items-center rounded-xl bg-secondary/50 border border-border px-3 text-xs text-muted-foreground">
            <span>/menu/</span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="w-full py-2 px-1 bg-transparent text-foreground focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
        </div>

        {/* Header Image */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Cover Banner Image
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={headerImageUrl}
                onChange={(e) => setHeaderImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
              />
              <label className="cursor-pointer py-2 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading..." : "Upload Banner"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {headerImageUrl && (
              <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-muted border border-border">
                <Image src={headerImageUrl} alt="Banner preview" fill className="object-cover" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Customer Display Layout (Admin Controlled)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(["CARDS", "GRID", "TABLE", "LIST", "MAGAZINE"] as const).map((layoutOpt) => (
              <button
                key={layoutOpt}
                type="button"
                onClick={() => setDisplayLayout(layoutOpt)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                  displayLayout === layoutOpt
                    ? "bg-primary text-black border-gold-500"
                    : "bg-secondary/40 text-foreground border-border hover:bg-secondary"
                }`}
              >
                {layoutOpt}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Choose how guests see your menu when they scan the QR code (Cards, Photo Grid, Structured Table, Compact List, or Editorial Magazine).
          </p>
        </div>

        {/* Scheduled / Time-of-Day Configuration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold-500" />
                Scheduled Service Window (Optional)
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automatically highlight this menu on your public business page during breakfast, lunch, or dinner hours.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setActiveStartTime(preset.start);
                  setActiveEndTime(preset.end);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-border bg-card hover:border-gold-500/50 text-foreground transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Start Time (24h)
              </label>
              <input
                type="time"
                value={activeStartTime}
                onChange={(e) => setActiveStartTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                End Time (24h)
              </label>
              <input
                type="time"
                value={activeEndTime}
                onChange={(e) => setActiveEndTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Active Days (Leave all unselected for every day)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_OPTIONS.map((day) => {
                const selected = activeDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selected
                        ? "bg-primary text-black border-gold-500"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Default Menu Toggle */}
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold-500" />
              Primary / Default Menu
            </div>
            <div className="text-[11px] text-muted-foreground">
              Feature this menu first on your business profile when no time-specific menu takes priority.
            </div>
          </div>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-5 h-5 rounded text-gold-500 focus:ring-gold-500"
          />
        </div>

        {/* Publishing Toggle */}
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-foreground">Publish to Table QR Codes</div>
            <div className="text-[11px] text-muted-foreground">
              When published, guests scanning the QR code immediately view this menu.
            </div>
          </div>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5 rounded text-gold-500 focus:ring-gold-500"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Menu Configuration"}
          </button>
        </div>
      </form>

      {/* Export & Backup */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileJson className="w-4 h-4 text-gold-500" />
            <span>Export Menu Data (JSON Backup)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download a complete offline copy of this menu, including all categories, dishes, prices, dietary tags, and allergens.
          </p>
        </div>
        <a
          href={`/api/menus/${menu.id}/export?download=true`}
          download
          className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-gold-500" />
          <span>Download JSON</span>
        </a>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-3xl bg-destructive/5 border border-destructive/20 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-destructive">Permanently Delete Menu</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            This action cannot be undone. All categories and dishes will be removed.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-destructive text-white hover:bg-destructive/90 transition-colors"
        >
          {deleting ? "Deleting..." : "Delete Menu"}
        </button>
      </div>
    </div>
  );
}

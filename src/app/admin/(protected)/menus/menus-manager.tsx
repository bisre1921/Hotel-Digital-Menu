"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  QrCode,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  X,
  Upload,
  Layers,
  Sparkles,
  Check,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { slugify } from "@/lib/utils";
import { GuestShareModal } from "@/components/menu/guest-share-modal";

interface MenuEntry {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  headerImageUrl?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  displayLayout: string;
  categoryCount: number;
  itemCount: number;
  qrCodeSvg?: string | null;
}

interface MenusManagerProps {
  hotelName: string;
  hotelSlug: string;
  initialMenus: MenuEntry[];
}

export function MenusManager({
  hotelName,
  hotelSlug,
  initialMenus,
}: MenusManagerProps) {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuEntry[]>(initialMenus);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQrMenu, setSelectedQrMenu] = useState<MenuEntry | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const displayLayout = "LIST";
  const [isPublished, setIsPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
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

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          headerImageUrl: headerImageUrl || null,
          displayLayout,
          isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create menu");
      }

      setMenus([
        {
          ...data.menu,
          categoryCount: 0,
          itemCount: 0,
        },
        ...menus,
      ]);
      setIsCreateOpen(false);
      setTitle("");
      setSlug("");
      setDescription("");
      setHeaderImageUrl("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (menuId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/menus/${menuId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      if (res.ok) {
        setMenus((prev) =>
          prev.map((m) =>
            m.id === menuId ? { ...m, isPublished: !current } : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (menuId: string) => {
    try {
      const res = await fetch(`/api/menus/${menuId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMenus([data.menu, ...menus]);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("Are you sure you want to permanently delete this menu?")) return;
    try {
      const res = await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => m.id !== menuId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyMenuLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/menu/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            Your business, on the menu
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Your menus
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            Manage menus for your cafe, restaurant, hotel or individual outlets.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
        <Link href="/admin/menus/import" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold hover:border-primary"><Upload className="h-4 w-4" /> Import existing menu</Link>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="py-2.5 px-5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Digital Menu
        </button>
        </div>
      </div>

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="group rounded-3xl bg-card border border-border/70 hover:border-gold-500/50 shadow-subtle hover:shadow-elevated transition-all flex flex-col overflow-hidden"
          >
            {/* Header / Thumbnail */}
            <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
              {menu.headerImageUrl ? (
                <Image
                  src={menu.headerImageUrl}
                  alt={menu.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/60">
                  <span className="font-serif italic text-muted-foreground">Digital Menu Outlet</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(menu.id, menu.isPublished)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md border transition-all ${
                    menu.isPublished
                      ? "bg-emerald-500/80 text-white border-emerald-400/30"
                      : "bg-black/75 text-amber-400 border-amber-500/40"
                  }`}
                >
                  {menu.isPublished ? "● Published" : "○ Draft"}
                </button>
              </div>

              {/* QR Button in Header */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setSelectedQrMenu(menu)}
                  className="p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition-colors"
                  title="View & Download QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl font-medium tracking-tight text-foreground group-hover:text-gold-400 transition-colors">
                    {menu.title}
                  </h3>
                </div>

                <div className="mt-1 text-xs text-muted-foreground font-mono">
                  /menu/{menu.slug}
                </div>

                {menu.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 font-light">
                    {menu.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{menu.categoryCount} categories</span>
                  <span>&bull;</span>
                  <span>{menu.itemCount} dishes</span>
                  <span>&bull;</span>
                  <span className="uppercase text-[10px]">Compact cards</span>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/menus/${menu.id}`}
                    className="py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-center bg-secondary hover:bg-gold-500 hover:text-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Menu
                  </Link>

                  <a
                    href={`/menu/${menu.slug}${!menu.isPublished ? "?preview=true" : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl text-xs font-medium uppercase tracking-wider text-center border border-border/80 hover:bg-secondary text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </a>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs">
                  <button
                    onClick={() => copyMenuLink(menu.slug, menu.id)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px]"
                  >
                    {copiedId === menu.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied URL
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy URL
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(menu.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                      title="Duplicate"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Menu Modal Dialog */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-luxury z-10 no-scrollbar"
            >
              <button
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-2xl font-medium text-foreground">
                Create Digital Menu
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Configure your menu details, presentation layout, and public access slug.
              </p>

              <form onSubmit={handleCreateMenu} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Menu Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. L'Étoile Fine Dining & Tasting"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Public URL Slug
                  </label>
                  <div className="flex items-center rounded-xl bg-secondary/50 border border-border overflow-hidden px-3 text-xs text-muted-foreground">
                    <span>/menu/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="letoile-dinner"
                      className="w-full py-2.5 px-1 bg-transparent text-foreground focus:outline-none"
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
                    placeholder="Short description highlighting the culinary atmosphere or sommelier pairings..."
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Header Banner Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer py-1.5 px-3 rounded-lg text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? "Uploading..." : "Or Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {headerImageUrl && (
                        <span className="text-xs text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Image attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="rounded-xl border border-border p-4 text-xs text-muted-foreground">Guest style: compact cream photo cards on a dark background, with category pills and clear prices.</p>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="publishCheck"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500"
                  />
                  <label htmlFor="publishCheck" className="text-xs text-foreground cursor-pointer">
                    Publish immediately (guests can scan and access via QR code)
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="py-2.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Save & Create Menu"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Share Modal */}
      {selectedQrMenu && (
        <GuestShareModal
          isOpen={!!selectedQrMenu}
          onClose={() => setSelectedQrMenu(null)}
          menuTitle={selectedQrMenu.title}
          hotelName={hotelName}
          menuSlug={selectedQrMenu.slug}
          menuId={selectedQrMenu.id}
          qrCodeSvg={selectedQrMenu.qrCodeSvg}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Eye,
  QrCode,
  Sparkles,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { GuestShareModal } from "@/components/menu/guest-share-modal";

interface FormattedMenu {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  headerImageUrl?: string | null;
  displayLayout: string;
  categoryCount: number;
  itemCount: number;
  qrCodeSvg?: string | null;
  createdAt: string;
}

interface Metrics {
  totalMenus: number;
  publishedMenus: number;
  totalItems: number;
  availableItems: number;
  chefSpecials: number;
  availabilityRate: number;
  totalScans: number;
  totalViews: number;
}

interface DashboardClientProps {
  hotel: {
    name: string;
    currencySymbol: string;
    currency: string;
    primaryColor: string;
  };
  initialMetrics: Metrics;
  initialMenus: FormattedMenu[];
}

export function AdminDashboardClient({
  hotel,
  initialMetrics,
  initialMenus,
}: DashboardClientProps) {
  const router = useRouter();
  const [menus, setMenus] = useState<FormattedMenu[]>(initialMenus);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [selectedQrMenu, setSelectedQrMenu] = useState<FormattedMenu | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleTogglePublish = async (menuId: string, currentStatus: boolean) => {
    setTogglingId(menuId);
    try {
      const res = await fetch(`/api/menus/${menuId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (res.ok) {
        setMenus((prev) =>
          prev.map((m) =>
            m.id === menuId ? { ...m, isPublished: !currentStatus } : m
          )
        );
        setMetrics((prev) => ({
          ...prev,
          publishedMenus: currentStatus
            ? prev.publishedMenus - 1
            : prev.publishedMenus + 1,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDuplicate = async (menuId: string) => {
    setDuplicatingId(menuId);
    try {
      const res = await fetch(`/api/menus/${menuId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
        setMenus([data.menu, ...menus]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("Are you sure you want to delete this menu? This will remove all its categories and items.")) {
      return;
    }
    setDeletingId(menuId);
    try {
      const res = await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => m.id !== menuId));
        setMetrics((prev) => ({
          ...prev,
          totalMenus: prev.totalMenus - 1,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Hospitality Management Suite
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            {hotel.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            Monitor real-time guest interactions, manage digital menus, and distribute contactless QR codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/menus"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Menu
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs uppercase tracking-wider font-medium">Published Menus</span>
            <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-foreground">
              {metrics.publishedMenus}
            </span>
            <span className="text-xs text-muted-foreground">/ {metrics.totalMenus} total</span>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Active on guest tables</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs uppercase tracking-wider font-medium">Total Culinary Dishes</span>
            <div className="p-2 rounded-lg bg-secondary text-foreground">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-foreground">
              {metrics.totalItems}
            </span>
            <span className="text-xs text-gold-500">{metrics.chefSpecials} specials</span>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-gold-500" />
            <span>{metrics.availabilityRate}% availability rate</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs uppercase tracking-wider font-medium">Guest QR Scans</span>
            <div className="p-2 rounded-lg bg-primary/10 text-gold-500">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-foreground">
              {metrics.totalScans}
            </span>
            <span className="text-xs text-emerald-500 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> High
            </span>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">
            Contactless mobile visits
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs uppercase tracking-wider font-medium">Digital Menu Views</span>
            <div className="p-2 rounded-lg bg-secondary text-foreground">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-foreground">
              {metrics.totalViews}
            </span>
            <span className="text-xs text-muted-foreground">page views</span>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">
            Real-time engagement
          </div>
        </div>
      </div>

      {/* Digital Menus Table / List */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-subtle">
        <div className="p-6 border-b border-border/70 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground">Hotel Digital Menus</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your menus, toggle instant publishing, or configure QR codes.
            </p>
          </div>

          <Link
            href="/admin/menus"
            className="text-xs font-semibold uppercase tracking-wider text-gold-500 hover:text-gold-400 flex items-center gap-1"
          >
            All Menus & Builder <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="py-3 px-6">Menu Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Structure</th>
                <th className="py-3 px-4">Layout</th>
                <th className="py-3 px-4 text-center">QR Code</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {menu.headerImageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/70">
                          <Image
                            src={menu.headerImageUrl}
                            alt={menu.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                          {menu.title.charAt(0)}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/admin/menus/${menu.id}`}
                          className="font-serif text-sm font-medium text-foreground hover:text-gold-400 transition-colors"
                        >
                          {menu.title}
                        </Link>
                        <div className="text-[11px] text-muted-foreground font-sans">
                          slug: /{menu.slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(menu.id, menu.isPublished)}
                      disabled={togglingId === menu.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                        menu.isPublished
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          menu.isPublished ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {togglingId === menu.id
                        ? "Updating..."
                        : menu.isPublished
                        ? "Published"
                        : "Draft"}
                    </button>
                  </td>

                  {/* Structure */}
                  <td className="py-4 px-4 text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">{menu.categoryCount}</span> categories
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{menu.itemCount}</span> total dishes
                    </div>
                  </td>

                  {/* Layout */}
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] uppercase font-mono">
                      {menu.displayLayout}
                    </span>
                  </td>

                  {/* QR Code */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setSelectedQrMenu(menu)}
                      className="p-2 rounded-xl bg-secondary/70 hover:bg-gold-500 hover:text-black border border-border/80 transition-all inline-flex items-center gap-1.5 text-xs font-medium"
                      title="View & Download QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/menu/${menu.slug}${!menu.isPublished ? "?preview=true" : ""}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title={menu.isPublished ? "View Public Menu" : "Preview Draft Menu"}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDuplicate(menu.id)}
                        disabled={duplicatingId === menu.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Duplicate Menu"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/admin/menus/${menu.id}`}
                        className="p-2 rounded-lg text-muted-foreground hover:text-gold-400 hover:bg-secondary transition-colors"
                        title="Edit Menu & Dishes"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDelete(menu.id)}
                        disabled={deletingId === menu.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Dialog Modal */}
      {selectedQrMenu && (
        <GuestShareModal
          isOpen={!!selectedQrMenu}
          onClose={() => setSelectedQrMenu(null)}
          menuTitle={selectedQrMenu.title}
          hotelName={hotel.name}
          menuSlug={selectedQrMenu.slug}
          qrCodeSvg={selectedQrMenu.qrCodeSvg}
        />
      )}
    </div>
  );
}

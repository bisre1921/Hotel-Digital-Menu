"use client";

import React, { useState, useEffect } from "react";
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
import s from "@/components/admin/workspace.module.css";
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [menus, setMenus] = useState<FormattedMenu[]>(initialMenus);
  useEffect(() => { setMenus(initialMenus); setMetrics(initialMetrics); }, [initialMenus, initialMetrics]);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [selectedQrMenu, setSelectedQrMenu] = useState<FormattedMenu | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<
    Array<{ date: string; scans: number; views: number }>
  >([]);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics) setMetrics(data.metrics);
        if (Array.isArray(data?.chartData)) setChartData(data.chartData);
      })
      .catch(() => {});
  }, []);

  const handleTogglePublish = async (menuId: string, currentStatus: boolean) => {
    setTogglingId(menuId); setError("");
    try {
      const res = await fetch(`/api/menus/${menuId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (!res.ok) throw new Error("Could not update the menu. Please try again.");
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
      setError(err instanceof Error ? err.message : "Could not complete the action. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDuplicate = async (menuId: string) => {
    setDuplicatingId(menuId); setError("");
    try {
      const res = await fetch(`/api/menus/${menuId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error("Could not update the menu. Please try again.");
      if (res.ok) {
        router.refresh();
        setMenus(current => [{ ...current.find(menu => menu.id === menuId)!, ...data.menu }, ...current]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the action. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("Are you sure you want to delete this menu? This will remove all its categories and items.")) {
      return;
    }
    setDeletingId(menuId); setError("");
    try {
      const res = await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not update the menu. Please try again.");
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => m.id !== menuId));
        router.refresh();
        setMetrics((prev) => ({
          ...prev,
          totalMenus: prev.totalMenus - 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the action. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = menus.filter(menu => menu.title.toLowerCase().includes(query.trim().toLowerCase()) && (status === "all" || menu.isPublished === (status === "published")));
  const maxDayActivity = Math.max(
    1,
    ...chartData.map((d) => Math.max(d.scans, d.views))
  );

  return <div>
    <div className={s.dashboardHeading}><div><span>{hotel.name}</span><h1>Your menu, at a glance.</h1><p>Keep your dishes fresh and your guests in the know.</p></div><Link href="/admin/menus" className={s.solidButton}>Manage menus <ArrowUpRight size={16} /></Link></div>
    <div className={s.taskGrid}><Link href="/admin/menus/import" className={s.taskCard}><div><h2>Bring your paper menu.</h2><p>Import an existing menu, review the details, and save a draft.</p></div><ArrowUpRight size={25} /></Link><Link href="/admin/profile" className={s.taskCard}><div><h2>Make it feel like you.</h2><p>Set your business name, identity and contact details.</p></div><ArrowUpRight size={25} /></Link></div>
    <div className={s.metrics} aria-label="Business metrics">{[
      ["Published menus", metrics.publishedMenus, `${metrics.totalMenus} menus in total`],
      ["Dishes", metrics.totalItems, `${metrics.availableItems} available (${metrics.availabilityRate}%) · ${metrics.chefSpecials} chef specials`],
      ["QR scans", metrics.totalScans, "All-time recorded scans"],
      ["Menu views", metrics.totalViews, "All-time recorded page views"],
    ].map(([label,value,note]) => <div className={s.metric} key={label}><span>{label}</span><strong>{Number(value).toLocaleString()}</strong><small>{note}</small></div>)}</div>
    {chartData.length > 0 && (
      <section className="mb-8 p-6 rounded-2xl bg-card border border-border shadow-subtle" aria-label="7-Day Guest Engagement">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-500" /> 7-Day Guest Engagement
            </h2>
            <p className="text-xs text-muted-foreground">
              Daily QR code table scans and digital menu views over the past 7 days
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 inline-block" /> QR Scans
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-foreground/30 inline-block" /> Page Views
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-32 pt-4 border-b border-border/60 pb-2">
          {chartData.map((day) => {
            const scanHeight = Math.max(6, Math.round((day.scans / maxDayActivity) * 100));
            const viewHeight = Math.max(6, Math.round((day.views / maxDayActivity) * 100));
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center h-24">
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t bg-gold-500 transition-all"
                    style={{ height: `${scanHeight}%` }}
                    title={`${day.date}: ${day.scans} QR scans`}
                  />
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t bg-foreground/25 transition-all"
                    style={{ height: `${viewHeight}%` }}
                    title={`${day.date}: ${day.views} views`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {day.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    )}
    {error && <p role="alert" className={s.dashboardError}>{error}</p>}
    <section className={s.menuPanel} aria-labelledby="menus-heading"><div className={s.panelHeader}><div><h2 id="menus-heading">Your menus</h2><p>Publish, edit or share a menu from one place.</p></div><div className={s.panelTools}><input aria-label="Search menus" placeholder="Find a menu…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter by publication status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></div></div>
      {filtered.length ? <div className={s.tableWrap}><table className={s.menuTable}><thead><tr><th scope="col">Menu</th><th scope="col">Status</th><th scope="col">Contents</th><th scope="col">Actions</th></tr></thead><tbody>{filtered.map(menu => <tr key={menu.id}><td><Link href={`/admin/menus/${menu.id}`}>{menu.title}</Link><small>/{menu.slug}</small></td><td><button className={s.status} data-live={menu.isPublished} onClick={() => handleTogglePublish(menu.id, menu.isPublished)} disabled={togglingId === menu.id} aria-label={`${menu.isPublished ? "Unpublish" : "Publish"} ${menu.title}`}>{togglingId === menu.id ? "Updating…" : menu.isPublished ? "Published" : "Draft"}</button></td><td>{menu.itemCount} dishes<small className="block mt-1 text-muted-foreground">{menu.categoryCount} categories</small></td><td><div className={s.rowActions}><a href={`/menu/${menu.slug}${!menu.isPublished ? "?preview=true" : ""}`} target="_blank" rel="noreferrer" aria-label={`Preview ${menu.title}`} title="Preview menu"><ExternalLink /></a><button onClick={() => setSelectedQrMenu(menu)} aria-label={`QR code for ${menu.title}`} title="QR code"><QrCode /></button><Link href={`/admin/menus/${menu.id}`} aria-label={`Edit ${menu.title}`} title="Edit menu"><Edit3 /></Link><button disabled={duplicatingId === menu.id} onClick={() => handleDuplicate(menu.id)} aria-label={`Duplicate ${menu.title}`} title="Duplicate menu"><Copy /></button><button disabled={deletingId === menu.id} onClick={() => handleDelete(menu.id)} aria-label={`Delete ${menu.title}`} title="Delete menu"><Trash2 /></button></div></td></tr>)}</tbody></table></div> : <div className={s.empty}>{menus.length ? "No menus match your search." : <>Your first menu starts here. <Link href="/admin/menus">Create a menu</Link> or <Link href="/admin/menus/import">import an existing one</Link>.</>}</div>}
    </section>
    {selectedQrMenu && <GuestShareModal isOpen onClose={() => setSelectedQrMenu(null)} menuTitle={selectedQrMenu.title} hotelName={hotel.name} menuSlug={selectedQrMenu.slug} qrCodeSvg={selectedQrMenu.qrCodeSvg} />}
  </div>;
}

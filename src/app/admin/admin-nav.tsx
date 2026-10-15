"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ScanLine,
  LayoutDashboard,
  UtensilsCrossed,
  Palette,
  Image as ImageIcon,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  X,
  Star,
  Hotel,
} from "lucide-react";
import design from "@/components/admin/workspace.module.css";
import { ThemeToggle } from "@/components/theme-toggle";

interface AdminNavProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  hotel: {
    id: string;
    name: string;
    slug: string;
    starRating?: number | null;
    logoUrl?: string | null;
    currencySymbol: string;
    primaryColor?: string | null;
  };
  firstMenuSlug?: string | null;
  children: React.ReactNode;
}

export function AdminNav({ user, hotel, firstMenuSlug, children }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/menus", label: "Menus & Dishes", icon: UtensilsCrossed },
    { href: "/admin/menus/import", label: "Import menu", icon: ScanLine },
    { href: "/admin/profile", label: "Business & Branding", icon: Palette },
    { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const publicMenuUrl = firstMenuSlug ? `/menu/${firstMenuSlug}` : null;

  return <div className={design.workspace}>
    <aside id="workspace-navigation" className={`${design.sidebar} ${mobileMenuOpen ? design.sidebarOpen : ""}`}>
      <Link href="/" className={design.wordmark}>luxmenu</Link>
      <div className={design.businessIdentity}><strong>{hotel.name}</strong><span>Business workspace</span></div>
      <nav aria-label="Workspace navigation">{navLinks.map(link => { const Icon = link.icon; const active = link.href === "/admin" ? pathname === "/admin" : link.href === "/admin/menus" ? pathname.startsWith(link.href) && !pathname.includes("/import") : pathname.startsWith(link.href); return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}><Icon /><span>{link.label}</span></Link>; })}</nav>
      {publicMenuUrl && <a className={design.sidebarPreview} href={publicMenuUrl} target="_blank" rel="noreferrer">View guest menu <ExternalLink size={15} /></a>}
      <div className={design.sidebarBottom}><div className={design.userIdentity}><span className={design.avatar}>{user.name.charAt(0)}</span><div><strong>{user.name}</strong><small>{user.role.toLowerCase()}</small></div></div><button className={design.logout} disabled={loggingOut} onClick={handleLogout}><LogOut size={15} />{loggingOut ? "Signing out…" : "Sign out"}</button></div>
    </aside>
    <div className={design.workspaceBody}><header className={design.workspaceTop}><div><button className={design.mobileToggle} aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen} aria-controls="workspace-navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}</button><span>Workspace /</span><strong>{pathname === "/admin" ? "Overview" : pathname.includes("import") ? "Menu import" : pathname.includes("menus") ? "Menus" : pathname.includes("media") ? "Media library" : "Business settings"}</strong></div><div><span>{hotel.name}</span><ThemeToggle /></div></header><main className={design.workspaceMain}>{children}</main></div>
    {mobileMenuOpen && <button aria-label="Close navigation" className={design.mobileBackdrop} onClick={() => setMobileMenuOpen(false)} />}
  </div>;
}

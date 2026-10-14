"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles,
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
    { href: "/admin/profile", label: "Hotel & Branding", icon: Palette },
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-serif text-sm font-semibold truncate max-w-[160px]">
              {hotel.name}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Admin Portal
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-border text-foreground"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Hotel Brand */}
          <div className="p-6 border-b border-border/70">
            <div className="flex items-center gap-3">
              {hotel.logoUrl ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border bg-secondary shrink-0">
                  <Image src={hotel.logoUrl} alt={hotel.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
              )}

              <div className="overflow-hidden">
                <h2 className="font-serif text-base font-semibold truncate tracking-tight text-foreground">
                  {hotel.name}
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {hotel.starRating && (
                    <span className="flex items-center text-gold-400">
                      {hotel.starRating} <Star className="w-2.5 h-2.5 fill-current ml-0.5 inline" />
                    </span>
                  )}
                  <span>&bull;</span>
                  <span>{hotel.currencySymbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-medium transition-all ${
                    isActive
                      ? "bg-primary text-black font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Public Preview Button */}
          {publicMenuUrl && (
            <div className="px-4 mt-2">
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-medium border border-border/80 bg-secondary/30 hover:bg-secondary text-foreground transition-all group"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                  View Guest Menu
                </span>
                <span className="text-[10px] text-muted-foreground opacity-60 group-hover:opacity-100">
                  Live
                </span>
              </a>
            </div>
          )}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center font-serif text-xs font-semibold shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium truncate text-foreground">{user.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{user.role}</div>
              </div>
            </div>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}
    </div>
  );
}

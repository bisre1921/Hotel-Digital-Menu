"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building,
  Upload,
  CheckCircle2,
  Save,
  Star,
  Sparkles,
  Palette,
  Type,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  UserPlus,
  Trash2,
  Shield,
  Coins,
} from "lucide-react";

interface HotelData {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  starRating?: number | null;
  phone?: string | null;
  email: string;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  currency: string;
  currencySymbol: string;
}

interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  avatarUrl?: string | null;
  createdAt: string;
}

interface ProfileFormProps {
  initialHotel: HotelData;
  currentUser?: {
    id: string;
    role: string;
    email: string;
  };
}

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "USD ($) — US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR (€) — Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) — British Pound" },
  { code: "CHF", symbol: "CHF", label: "CHF — Swiss Franc" },
  { code: "AED", symbol: "AED", label: "AED — UAE Dirham" },
  { code: "JPY", symbol: "¥", label: "JPY (¥) — Japanese Yen" },
  { code: "ETB", symbol: "Br", label: "ETB (Br) — Ethiopian Birr" },
];

const LUXURY_PALETTES = [
  { name: "Signature Gold", primary: "#B89334", accent: "#131418" },
  { name: "Burgundy Wine", primary: "#9E2A2B", accent: "#0F172A" },
  { name: "Riviera Emerald", primary: "#047857", accent: "#06281E" },
  { name: "Royal Sapphire", primary: "#1D4ED8", accent: "#0F172A" },
  { name: "Rose Gold Champagne", primary: "#D48B6A", accent: "#1C1412" },
  { name: "Obsidian Noir", primary: "#D9C485", accent: "#0A0A0C" },
];

export function ProfileForm({ initialHotel, currentUser }: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<HotelData>({
    ...initialHotel,
    starRating: initialHotel.starRating || 5,
    primaryColor: initialHotel.primaryColor || "#B89334",
    accentColor: initialHotel.accentColor || "#131418",
    fontFamily: initialHotel.fontFamily || "serif",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    reason?: string;
  }>({ checking: false, available: true });
  const [copiedSlugLink, setCopiedSlugLink] = useState(false);

  React.useEffect(() => {
    const clean = (formData.slug || "").trim().toLowerCase();
    if (!clean || clean === initialHotel.slug) {
      setSlugStatus({ checking: false, available: true, reason: "Current business address" });
      return;
    }

    let cancelled = false;
    setSlugStatus({ checking: true, available: null });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hotel/check-slug?slug=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (!cancelled) {
          setSlugStatus({
            checking: false,
            available: Boolean(data.available),
            reason: data.reason,
          });
        }
      } catch {
        if (!cancelled) {
          setSlugStatus({ checking: false, available: null });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.slug, initialHotel.slug]);

  // Team & Staff Management State (/api/hotel/users)
  const canManageTeam = !currentUser || currentUser.role === "OWNER" || currentUser.role === "MANAGER";
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"OWNER" | "MANAGER" | "STAFF">("STAFF");
  const [addingMember, setAddingMember] = useState(false);

  React.useEffect(() => {
    if (!canManageTeam) return;
    let active = true;
    setLoadingTeam(true);
    fetch("/api/hotel/users")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load team"))))
      .then((data) => {
        if (active && Array.isArray(data)) setTeamUsers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingTeam(false);
      });
    return () => {
      active = false;
    };
  }, [canManageTeam]);

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    setTeamError(null);
    setTeamSuccess(null);
    try {
      const res = await fetch("/api/hotel/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName,
          email: newMemberEmail,
          password: newMemberPassword,
          role: newMemberRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add team member");
      }
      setTeamUsers((prev) => [...prev, data.user]);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPassword("");
      setNewMemberRole("STAFF");
      setTeamSuccess(`Added ${data.user.name} (${data.user.role}) to the hotel team.`);
      setTimeout(() => setTeamSuccess(null), 4000);
    } catch (err: any) {
      setTeamError(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: "OWNER" | "MANAGER" | "STAFF") => {
    setTeamError(null);
    setTeamSuccess(null);
    try {
      const res = await fetch(`/api/hotel/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }
      setTeamUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
      setTeamSuccess(`Updated role for ${data.user.name} to ${data.user.role}.`);
      setTimeout(() => setTeamSuccess(null), 3000);
    } catch (err: any) {
      setTeamError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from your hotel team?`)) return;
    setTeamError(null);
    setTeamSuccess(null);
    try {
      const res = await fetch(`/api/hotel/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      setTeamUsers((prev) => prev.filter((u) => u.id !== userId));
      setTeamSuccess(`Removed ${userName} from your team.`);
      setTimeout(() => setTeamSuccess(null), 3000);
    } catch (err: any) {
      setTeamError(err.message);
    }
  };

  const handleMediaUpload = async (file: File, isLogo: boolean) => {
    if (isLogo) setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (res.ok) {
        if (isLogo) {
          setFormData((prev) => ({ ...prev, logoUrl: json.url }));
        } else {
          setFormData((prev) => ({ ...prev, coverImageUrl: json.url }));
        }
      } else {
        alert(json.error || "Upload failed");
      }
    } catch {
      alert("Media upload failed");
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugStatus.available === false) {
      alert(slugStatus.reason || "Please choose an available business address slug.");
      return;
    }
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/hotel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug.trim().toLowerCase(),
          tagline: formData.tagline || null,
          description: formData.description || null,
          starRating: Number(formData.starRating),
          phone: formData.phone || null,
          email: formData.email,
          website: formData.website || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          logoUrl: formData.logoUrl || null,
          coverImageUrl: formData.coverImageUrl || null,
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor,
          fontFamily: formData.fontFamily,
          currency: formData.currency,
          currencySymbol: formData.currencySymbol,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSavedSuccess(true);
      router.refresh();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            Property & Identity Configuration
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Hotel Profile & Branding
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            Customize your brand colors, typography, logos, and concierge contact details across all guest menus.
          </p>
        </div>

        {savedSuccess && (
          <div className="py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" /> Branding saved successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Property Identity */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-subtle space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                <Building className="w-5 h-5 text-gold-500" />
                <h3 className="font-serif text-lg font-medium text-foreground">Property Details</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Hotel / Establishment Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              {/* Public Business Address & Subdomain Picker */}
              <div className="p-4 rounded-2xl bg-secondary/35 border border-border/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-gold-500" />
                    Public Business Address & Subdomain
                  </label>
                  {slugStatus.checking ? (
                    <span className="text-[11px] text-muted-foreground">Checking availability…</span>
                  ) : slugStatus.available === true ? (
                    <span className="text-[11px] font-semibold text-emerald-400">
                      ✓ {slugStatus.reason || "Available"}
                    </span>
                  ) : slugStatus.available === false ? (
                    <span className="text-[11px] font-semibold text-destructive">
                      ✕ {slugStatus.reason || "Unavailable"}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center rounded-xl bg-card border border-border focus-within:border-gold-500 px-3 text-xs text-muted-foreground">
                  <span className="font-mono">/business/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-"),
                      })
                    }
                    placeholder="grand-azure-addis"
                    className="w-full py-2.5 px-1 bg-transparent text-foreground font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/business/${formData.slug}`;
                      navigator.clipboard.writeText(url);
                      setCopiedSlugLink(true);
                      setTimeout(() => setCopiedSlugLink(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium shrink-0"
                  >
                    {copiedSlugLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>
                    Subdomain ready: <code className="text-foreground font-mono">{formData.slug || "your-hotel"}.menu</code>
                  </span>
                  <a
                    href={`/business/${formData.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold-500 hover:underline font-medium"
                  >
                    Open Public Hub →
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline ?? ""}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Timeless luxury overlooking the caldera"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Star Rating (1 - 5 Stars)
                  </label>
                  <select
                    value={formData.starRating ?? 5}
                    onChange={(e) => setFormData({ ...formData, starRating: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value={5}>★★★★★ 5-Star Luxury Palace</option>
                    <option value={4}>★★★★ 4-Star Boutique Hotel</option>
                    <option value={3}>★★★ 3-Star Premium Hotel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  About The Hotel
                </label>
                <textarea
                  rows={3}
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Story of the estate, Michelin pedigree, culinary team..."
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Concierge Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone ?? ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Official Website
                  </label>
                  <input
                    type="url"
                    value={formData.website ?? ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address ?? ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city ?? ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country ?? ""}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-gold-500" /> Default Currency (ISO 4217)
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => {
                      const selected = CURRENCY_OPTIONS.find((c) => c.code === e.target.value);
                      setFormData({
                        ...formData,
                        currency: e.target.value,
                        currencySymbol: selected ? selected.symbol : formData.currencySymbol,
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Visual Branding & Theming */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-subtle space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                <Palette className="w-5 h-5 text-gold-500" />
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Bespoke Branding & Palettes
                </h3>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Luxury Color Palettes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LUXURY_PALETTES.map((pal) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          primaryColor: pal.primary,
                          accentColor: pal.accent,
                        })
                      }
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        formData.primaryColor === pal.primary
                          ? "border-gold-500 bg-secondary"
                          : "border-border/80 hover:bg-secondary/40"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground">{pal.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{pal.primary}</div>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: pal.primary }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor ?? "#B89334"}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-border"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor ?? "#B89334"}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Typography Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fontFamily: "serif" })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border font-serif transition-all ${
                        formData.fontFamily === "serif"
                          ? "bg-primary text-black border-gold-500 font-bold"
                          : "bg-secondary/40 text-foreground border-border hover:bg-secondary"
                      }`}
                    >
                      Playfair Serif
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fontFamily: "sans" })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border font-sans transition-all ${
                        formData.fontFamily === "sans"
                          ? "bg-primary text-black border-gold-500 font-bold"
                          : "bg-secondary/40 text-foreground border-border hover:bg-secondary"
                      }`}
                    >
                      Modern Inter
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo and Cover upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hotel Crest / Logo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.logoUrl ?? ""}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="URL or Upload"
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                    />
                    <label className="cursor-pointer py-2 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], true)}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                  {uploadingLogo && <div className="text-[11px] text-gold-500">Uploading logo...</div>}
                  {formData.logoUrl && (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border">
                      <Image src={formData.logoUrl} alt="Logo" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Resort Hero Cover Banner
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.coverImageUrl ?? ""}
                      onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                      placeholder="URL or Upload"
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                    />
                    <label className="cursor-pointer py-2 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], false)}
                        className="hidden"
                        disabled={uploadingCover}
                      />
                    </label>
                  </div>
                  {uploadingCover && <div className="text-[11px] text-gold-500">Uploading cover...</div>}
                  {formData.coverImageUrl && (
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted border border-border">
                      <Image src={formData.coverImageUrl} alt="Cover" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3.5 px-8 rounded-xl font-semibold text-xs uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving Changes..." : "Save Hotel Profile & Branding"}
              </button>
            </div>
          </form>

          {/* Section 3: Team & Staff Management (/api/hotel/users) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-gold-500" />
                <div>
                  <h3 className="font-serif text-lg font-medium text-foreground">
                    Team & Staff Access
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage hotel administrators, F&B managers, and staff accounts for this property.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-[10px] font-semibold uppercase tracking-wider text-gold-500 flex items-center gap-1">
                <Shield className="w-3 h-3" /> {currentUser?.role ?? "OWNER"}
              </span>
            </div>

            {teamError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {teamError}
              </div>
            )}
            {teamSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs">
                {teamSuccess}
              </div>
            )}

            {/* Staff List */}
            <div className="space-y-2.5">
              {loadingTeam ? (
                <div className="text-xs text-muted-foreground py-4">Loading team accounts...</div>
              ) : teamUsers.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4">No staff members found.</div>
              ) : (
                teamUsers.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-secondary/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{member.name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-500 text-[10px] font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManageTeam ? (
                          <select
                            value={member.role}
                            disabled={isSelf}
                            onChange={(e) =>
                              handleUpdateUserRole(
                                member.id,
                                e.target.value as "OWNER" | "MANAGER" | "STAFF"
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-medium text-foreground focus:outline-none disabled:opacity-60"
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="STAFF">STAFF</option>
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-medium text-muted-foreground">
                            {member.role}
                          </span>
                        )}

                        {canManageTeam && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(member.id, member.name)}
                            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                            title="Remove staff member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Invite / Add New Staff Member */}
            {canManageTeam ? (
              <form
                onSubmit={handleAddTeamMember}
                className="pt-4 border-t border-border/60 space-y-4"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-500">
                  <UserPlus className="w-3.5 h-3.5" /> Add New Team Member
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Chef Laurent)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Temporary Password (min 8 chars)"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) =>
                      setNewMemberRole(e.target.value as "OWNER" | "MANAGER" | "STAFF")
                    }
                    className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="STAFF">STAFF — Menu & Dish Editing</option>
                    <option value="MANAGER">MANAGER — Operations & Moderation</option>
                    <option value="OWNER">OWNER — Full Property Access</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="py-2.5 px-5 rounded-xl bg-secondary border border-gold-500/40 text-gold-500 hover:bg-gold-500 hover:text-black text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {addingMember ? "Creating Account..." : "Invite Staff Member"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                Only accounts with <strong>OWNER</strong> or <strong>MANAGER</strong> privileges can manage team access.
              </div>
            )}
          </div>
        </div>

        {/* Live Brand Preview Card */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            Live Guest View Preview
          </div>

          <div
            className={`rounded-3xl border border-border overflow-hidden bg-card shadow-luxury ${
              formData.fontFamily === "sans" ? "font-sans" : "font-serif"
            }`}
          >
            {/* Cover header */}
            <div className="relative h-36 bg-black">
              {formData.coverImageUrl ? (
                <Image
                  src={formData.coverImageUrl}
                  alt="Preview"
                  fill
                  className="object-cover opacity-60"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-stone-900 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                {formData.logoUrl ? (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/60">
                    <Image src={formData.logoUrl} alt="Logo" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center font-bold">
                    {formData.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                    {formData.name}
                  </h4>
                  <div className="flex items-center gap-0.5 text-gold-400">
                    {Array.from({ length: formData.starRating || 5 }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card Body */}
            <div className="p-4 space-y-3 font-sans">
              <p className="text-[11px] text-muted-foreground font-light line-clamp-2">
                {formData.tagline || "Artisanal dining experience tailored for discerning guests."}
              </p>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Wagyu Beef Tartare</div>
                  <div className="text-[10px] text-muted-foreground">Winter truffle, gold cracker</div>
                </div>
                <div
                  className="text-xs font-bold"
                  style={{ color: formData.primaryColor || "#B89334" }}
                >
                  {formData.currencySymbol}58.00
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-black shadow-sm transition-opacity"
                style={{ backgroundColor: formData.primaryColor || "#B89334" }}
              >
                Sample Action Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Building, Mail, Lock, User, Globe, ArrowRight, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    hotelName: "",
    name: "",
    email: "",
    password: "",
    currency: "USD",
    currencySymbol: "$",
    city: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let symbol = "$";
    if (val === "EUR") symbol = "€";
    if (val === "GBP") symbol = "£";
    if (val === "JPY") symbol = "¥";
    if (val === "CHF") symbol = "CHF";
    if (val === "AED") symbol = "AED";
    setFormData({ ...formData, currency: val, currencySymbol: symbol });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to register hotel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      {/* Photography Column */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-black overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85"
          alt="Luxury Resort Architecture"
          fill
          className="object-cover opacity-50 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl tracking-wider text-white">
              Lux<span className="text-gold-400">Menu</span>
            </span>
          </div>
          <p className="text-xs text-white/60 uppercase tracking-widest mt-1">
            Global Digital Menu Infrastructure
          </p>
        </div>

        <div className="relative z-10 max-w-md space-y-3">
          <h3 className="font-serif text-2xl text-white font-medium">
            Elevate Your Guest Dining Experience
          </h3>
          <p className="text-xs text-white/70 font-light leading-relaxed">
            Create instantaneous, contact-free digital menus with contactless QR codes, rich culinary photography, chef specials, and automated multi-tenant branding.
          </p>
        </div>
      </div>

      {/* Register Form Column */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl tracking-wider">
              Lux<span className="text-gold-400">Menu</span>
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="max-w-lg w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
              Register Hotel Property
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">
              Onboard your hotel or restaurant property to start creating branded digital menus in seconds.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-sm flex items-center gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Hotel or Restaurant Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  name="hotelName"
                  required
                  value={formData.hotelName}
                  onChange={handleChange}
                  placeholder="e.g. The Ritz-Carlton Kyoto"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  General Manager / Lead Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Marcella D'Angelo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Operating Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="AED">AED - Emirati Dirham</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Paris, New York, Tokyo"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="France, USA, Japan"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="director@luxuryresort.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-medium text-xs uppercase tracking-widest bg-primary text-black hover:opacity-95 shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? "Registering Property..." : "Launch Hotel Digital Menus"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/admin/login"
              className="text-gold-500 hover:text-gold-400 font-semibold underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Lock, Mail, ArrowRight, Hotel, AlertCircle, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      {/* Visual Photography Column */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-black overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=85"
          alt="Luxury dining atmosphere"
          fill
          className="object-cover opacity-45 scale-105 animate-fadeIn"
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
            Hospitality Digital Menu Platform
          </p>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <blockquote className="font-serif text-2xl text-white/95 font-light leading-snug">
            &ldquo;An extraordinary digital dining experience that honors the craftsmanship of our culinary artisans.&rdquo;
          </blockquote>
          <div className="text-xs text-gold-300/80 uppercase tracking-widest">
            Executive Culinary Direction &bull; Michelin Partner
          </div>
        </div>
      </div>

      {/* Login Form Column */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
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

        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
              Hotel Portal Sign In
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">
              Enter your credentials to access your hotel&apos;s digital menus, QR codes, and culinary analytics.
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
                Staff / Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@grandazure.com"
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-medium text-xs uppercase tracking-widest bg-primary text-black hover:opacity-95 shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Hotel Dashboard"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for instant evaluation */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
              Demo Hotel Profiles (One-Click)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@grandazure.com")}
                className="p-3 text-left rounded-xl border border-border/80 hover:border-gold-500/50 bg-secondary/40 hover:bg-secondary transition-all text-xs group"
              >
                <div className="font-semibold text-foreground group-hover:text-gold-400 transition-colors">
                  The Grand Azure
                </div>
                <div className="text-[11px] text-muted-foreground">Santorini, Greece &bull; 5 Star</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("owner@palaisgermain.com")}
                className="p-3 text-left rounded-xl border border-border/80 hover:border-gold-500/50 bg-secondary/40 hover:bg-secondary transition-all text-xs group"
              >
                <div className="font-semibold text-foreground group-hover:text-gold-400 transition-colors">
                  Saint-Germain Palais
                </div>
                <div className="text-[11px] text-muted-foreground">Paris, France &bull; Boutique</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have a hotel registered yet?{" "}
            <Link
              href="/admin/register"
              className="text-gold-500 hover:text-gold-400 font-semibold underline underline-offset-4"
            >
              Register Hotel
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground/60 py-2">
          &copy; {new Date().getFullYear()} LuxMenu SaaS. All rights reserved.
        </div>
      </div>
    </div>
  );
}

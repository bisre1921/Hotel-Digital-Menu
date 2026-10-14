import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  QrCode,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Palette,
  ArrowRight,
  ExternalLink,
  Star,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-gold-500/20 selection:text-gold-400">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center shadow-subtle">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-wider">
                Lux<span className="text-gold-500">Menu</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-muted-foreground uppercase tracking-widest ml-2 px-2 py-0.5 rounded-full border border-border">
                Hospitality SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/menu/azure-letoile-dinner"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gold-500" /> Live Demo Menu
            </Link>
            <Link
              href="/admin/login"
              className="py-2.5 px-5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 transition-all"
            >
              Hotel Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation Hospitality Digital Menus
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-foreground leading-[1.1]">
            Elevating Fine Dining with{" "}
            <span className="gold-gradient-text italic font-serif">
              Contactless Elegance
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            The multi-tenant digital menu platform crafted for luxury hotels, boutique resorts, and Michelin-starred dining rooms. Instant QR code access, haute dish photography, and effortless hotel administration.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/menu/azure-letoile-dinner"
              className="w-full sm:w-auto py-3.5 px-8 rounded-full text-xs font-semibold uppercase tracking-widest bg-primary text-black hover:opacity-95 shadow-luxury flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <span>Explore Live Guest Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/admin/login"
              className="w-full sm:w-auto py-3.5 px-8 rounded-full text-xs font-semibold uppercase tracking-widest border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground flex items-center justify-center gap-2 transition-all"
            >
              <span>Sign In to Admin Portal</span>
            </Link>
          </div>
        </div>

        {/* Ambient Gold Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold-500/10 blur-[140px] pointer-events-none rounded-full" />
      </section>

      {/* Featured Properties Showcase */}
      <section className="py-16 bg-secondary/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold block">
              Multi-Tenant Hospitality Network
            </span>
            <h2 className="font-serif text-3xl font-medium text-foreground">
              Seeded Live Hotel Outlets
            </h2>
            <p className="text-xs text-muted-foreground font-light">
              Experience independent hotel menus operating on isolated tenant databases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Property 1 */}
            <div className="group rounded-3xl bg-card border border-border overflow-hidden shadow-elevated flex flex-col justify-between">
              <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
                  alt="The Grand Azure"
                  fill
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-gold-400 mb-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white">The Grand Azure</h3>
                    <p className="text-xs text-white/70">Oia, Santorini &bull; Greece</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gold-500 text-black">
                    Gold Luxury Theme
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  Avant-garde Michelin tasting menu featuring Oscietra Royal Caviar, Hokkaido Scallops, 45-day dry aged ribeyes, and botanical cocktail mixology.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/menu/azure-letoile-dinner"
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-center bg-primary text-black hover:opacity-95 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Guest Menu
                  </Link>
                  <Link
                    href="/menu/azure-pool-lounge"
                    className="py-2.5 px-4 rounded-xl text-xs font-medium uppercase tracking-wider text-center border border-border/80 hover:bg-secondary text-foreground flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Pool Lounge
                  </Link>
                </div>
              </div>
            </div>

            {/* Property 2 */}
            <div className="group rounded-3xl bg-card border border-border overflow-hidden shadow-elevated flex flex-col justify-between">
              <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
                  alt="Hôtel Saint-Germain Palais"
                  fill
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-gold-400 mb-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white">Hôtel Saint-Germain</h3>
                    <p className="text-xs text-white/70">Paris &bull; France</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-900 text-white border border-rose-700/50">
                    Bordeaux Palette
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  Classical Parisian bistronomy with pan-seared duck foie gras, seasonal truffled soufflés, and French grand cru cellars.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/menu/saint-germain-jardin"
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-center bg-primary text-black hover:opacity-95 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Guest Menu
                  </Link>
                  <Link
                    href="/admin/login"
                    className="py-2.5 px-4 rounded-xl text-xs font-medium uppercase tracking-wider text-center border border-border/80 hover:bg-secondary text-foreground flex items-center justify-center gap-1.5"
                  >
                    <span>Owner Portal</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold block">
            Crafted for Perfection
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground">
            Complete Digital Hospitality Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-card border border-border/70 shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 text-gold-500 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              Branded QR Code Studio
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              Export downloadable vector SVGs and ultra-high-resolution PNGs customized to your hotel brand colors, optimized for tables, acrylic stands, and room service.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/70 shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-foreground flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              Instant Mobile Experience
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              Zero apps to download. Guests instantly scan and explore smooth interactive categories, live search, dietary filters (Vegan, Gluten-Free, Halal), and video dish presentations.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/70 shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 text-gold-500 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              Multi-Tenant Security
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              Full cryptographic session authentication with role-based access control. Each hotel operates in complete database isolation with custom currencies and branding tokens.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/60 text-center font-sans text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span className="font-serif font-bold text-foreground">LuxMenu Digital Hospitality</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} LuxMenu SaaS. Crafted with Next.js, TypeScript, Tailwind, and PostgreSQL.
          </div>
        </div>
      </footer>
    </div>
  );
}

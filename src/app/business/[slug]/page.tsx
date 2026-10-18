import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant-host";
import { formatMenuSchedule, isMenuActiveNow } from "@/lib/menu-helpers";

export const dynamic = "force-dynamic";

export default async function BusinessMenusPage({ params }: { params: { slug: string } }) {
  if (RESERVED_SUBDOMAINS.has(params.slug)) notFound();
  const business = await db.hotel.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      tagline: true,
      city: true,
      phone: true,
      menus: {
        where: { isPublished: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          isDefault: true,
          activeStartTime: true,
          activeEndTime: true,
          activeDays: true,
        },
      },
    },
  });
  if (!business) notFound();

  const now = new Date();
  const decoratedMenus = business.menus
    .map((m) => {
      const hasSchedule = Boolean(
        m.activeStartTime || m.activeEndTime || (m.activeDays && m.activeDays.length > 0)
      );
      const activeNow = isMenuActiveNow(m, now);
      return {
        ...m,
        hasSchedule,
        activeNow,
        scheduleText: formatMenuSchedule(m),
      };
    })
    .sort((a, b) => {
      const aScore = (a.activeNow && a.hasSchedule ? 4 : 0) + (a.isDefault ? 2 : 0) + (a.activeNow ? 1 : 0);
      const bScore = (b.activeNow && b.hasSchedule ? 4 : 0) + (b.isDefault ? 2 : 0) + (b.activeNow ? 1 : 0);
      return bScore - aScore;
    });

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
      <p className="text-xs uppercase tracking-[.2em] text-primary">
        Welcome{business.city ? ` · ${business.city}` : ""}
      </p>
      <h1 className="mt-4 font-serif text-4xl">{business.name}</h1>
      {business.tagline && <p className="mt-3 text-muted-foreground">{business.tagline}</p>}
      <h2 className="mb-4 mt-12 text-sm font-semibold">Explore our menus</h2>
      <div className="space-y-3">
        {decoratedMenus.map((menu) => (
          <Link
            href={`/menu/${menu.slug}`}
            key={menu.id}
            className={`block rounded-2xl border bg-card p-6 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-primary ${
              menu.activeNow && (menu.hasSchedule || menu.isDefault)
                ? "border-primary/70"
                : "border-border"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif text-2xl">
                {menu.title} <span aria-hidden="true">→</span>
              </h3>
              <div className="flex items-center gap-1.5">
                {menu.hasSchedule && menu.activeNow && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Serving Now
                  </span>
                )}
                {menu.isDefault && (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Featured
                  </span>
                )}
              </div>
            </div>
            {menu.scheduleText && (
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                Hours: {menu.scheduleText}
              </p>
            )}
            {menu.description && (
              <p className="mt-2 text-sm text-muted-foreground">{menu.description}</p>
            )}
          </Link>
        ))}
      </div>
      {!decoratedMenus.length && (
        <p className="rounded-2xl border border-border p-6 text-muted-foreground">
          Our menu is being prepared. Please check back soon.
        </p>
      )}
      {business.phone && (
        <a
          className="mt-10 inline-block text-sm underline underline-offset-4"
          href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}
        >
          Call us · {business.phone}
        </a>
      )}
    </main>
  );
}

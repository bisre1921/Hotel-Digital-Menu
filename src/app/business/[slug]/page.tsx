import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant-host";

export const dynamic = "force-dynamic";

export default async function BusinessMenusPage({ params }: { params: { slug: string } }) {
  if (RESERVED_SUBDOMAINS.has(params.slug)) notFound();
  const business = await db.hotel.findUnique({
    where: { slug: params.slug },
    select: { name: true, tagline: true, city: true, phone: true, menus: {
      where: { isPublished: true }, orderBy: { createdAt: "asc" },
      select: { id: true, title: true, slug: true, description: true },
    } },
  });
  if (!business) notFound();
  return <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
    <p className="text-xs uppercase tracking-[.2em] text-primary">Welcome{business.city ? ` · ${business.city}` : ""}</p>
    <h1 className="mt-4 font-serif text-4xl">{business.name}</h1>
    {business.tagline && <p className="mt-3 text-muted-foreground">{business.tagline}</p>}
    <h2 className="mb-4 mt-12 text-sm font-semibold">Explore our menus</h2>
    <div className="space-y-3">{business.menus.map((menu) => <Link href={`/menu/${menu.slug}`} key={menu.id} className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-primary">
      <h3 className="font-serif text-2xl">{menu.title} <span aria-hidden="true">→</span></h3>
      {menu.description && <p className="mt-2 text-sm text-muted-foreground">{menu.description}</p>}
    </Link>)}</div>
    {!business.menus.length && <p className="rounded-2xl border border-border p-6 text-muted-foreground">Our menu is being prepared. Please check back soon.</p>}
    {business.phone && <a className="mt-10 inline-block text-sm underline underline-offset-4" href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>Call us · {business.phone}</a>}
  </main>;
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  const hotel = await db.hotel.findUnique({
    where: { id: session.hotelId },
    include: {
      menus: {
        where: { isPublished: true },
        take: 1,
        select: { slug: true },
      },
    },
  });

  if (!hotel) {
    redirect("/admin/login");
  }

  const firstMenuSlug = hotel.menus[0]?.slug || null;

  return (
    <AdminNav
      user={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
      hotel={{
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        starRating: hotel.starRating,
        logoUrl: hotel.logoUrl,
        currencySymbol: hotel.currencySymbol,
        primaryColor: hotel.primaryColor,
      }}
      firstMenuSlug={firstMenuSlug}
    >
      {children}
    </AdminNav>
  );
}

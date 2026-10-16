import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const hotel = await db.hotel.findUnique({
    where: { id: session.hotelId },
  });

  if (!hotel) {
    redirect("/admin/login");
  }

  const menus = await db.menu.findMany({
    where: { hotelId: session!.hotelId },
    include: {
      categories: {
        include: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Analytics counts
  const [totalScans, totalViews] = await Promise.all([
    db.analyticsEvent.count({
      where: { hotelId: session!.hotelId, type: "QR_SCAN" },
    }),
    db.analyticsEvent.count({
      where: { hotelId: session!.hotelId, type: "PAGE_VIEW" },
    }),
  ]);

  // Compute item metrics
  let totalItems = 0;
  let availableItems = 0;
  let chefSpecials = 0;

  const formattedMenus = menus.map((menu) => {
    let menuItemsCount = 0;
    menu.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        totalItems++;
        menuItemsCount++;
        if (item.isAvailable) availableItems++;
        if (item.isChefSpecial) chefSpecials++;
      });
    });

    return {
      id: menu.id,
      title: menu.title,
      slug: menu.slug,
      isPublished: menu.isPublished,
      publishedAt: menu.publishedAt ? menu.publishedAt.toISOString() : null,
      headerImageUrl: menu.headerImageUrl,
      displayLayout: menu.displayLayout,
      categoryCount: menu.categories.length,
      itemCount: menuItemsCount,
      qrCodeSvg: menu.qrCodeSvg,
      createdAt: menu.createdAt.toISOString(),
    };
  });

  const metrics = {
    totalMenus: menus.length,
    publishedMenus: menus.filter((m) => m.isPublished).length,
    totalItems,
    availableItems,
    chefSpecials,
    availabilityRate: totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 100,
    totalScans,
    totalViews,
  };

  return (
    <AdminDashboardClient
      hotel={{
        name: hotel!.name,
        currencySymbol: hotel!.currencySymbol,
        currency: hotel!.currency,
        primaryColor: hotel!.primaryColor || "#B89334",
      }}
      initialMetrics={metrics}
      initialMenus={formattedMenus}
    />
  );
}

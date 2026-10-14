import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MenusManager } from "./menus-manager";

export default async function MenusPage() {
  const session = await getSession();

  const hotel = await db.hotel.findUnique({
    where: { id: session!.hotelId },
  });

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

  const formattedMenus = menus.map((m) => {
    const totalItems = m.categories.reduce(
      (sum, cat) => sum + cat.items.length,
      0
    );
    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      headerImageUrl: m.headerImageUrl,
      isPublished: m.isPublished,
      publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null,
      displayLayout: m.displayLayout,
      categoryCount: m.categories.length,
      itemCount: totalItems,
      qrCodeSvg: m.qrCodeSvg,
    };
  });

  return (
    <MenusManager
      hotelName={hotel!.name}
      hotelSlug={hotel!.slug}
      initialMenus={formattedMenus}
    />
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MediaClient } from "./media-client";

export default async function MediaPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Fetch all media URLs used across the hotel's menus and items
  const menus = await db.menu.findMany({
    where: { hotelId: session.hotelId },
    include: {
      categories: {
        include: {
          items: true,
        },
      },
    },
  });

  const mediaList: { url: string; title: string; type: "image" | "video"; context: string }[] = [];

  menus.forEach((m) => {
    if (m.headerImageUrl) {
      mediaList.push({
        url: m.headerImageUrl,
        title: `${m.title} Cover`,
        type: "image",
        context: "Menu Banner",
      });
    }

    m.categories.forEach((c) => {
      if (c.imageUrl) {
        mediaList.push({
          url: c.imageUrl,
          title: `${c.name} Header`,
          type: "image",
          context: "Category Banner",
        });
      }

      c.items.forEach((item) => {
        if (item.imageUrl) {
          mediaList.push({
            url: item.imageUrl,
            title: item.name,
            type: "image",
            context: "Dish Photo",
          });
        }
        if (item.videoUrl) {
          mediaList.push({
            url: item.videoUrl,
            title: `${item.name} Presentation`,
            type: "video",
            context: "Dish Video",
          });
        }
      });
    });
  });

  // Remove duplicates
  const uniqueMedia = Array.from(
    new Map(mediaList.map((item) => [item.url, item])).values()
  );

  return <MediaClient initialMedia={uniqueMedia} />;
}

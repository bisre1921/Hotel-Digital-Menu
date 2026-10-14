import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MenuEditor } from "./menu-editor";

interface Props {
  params: { id: string };
}

export default async function MenuDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const menu = await db.menu.findFirst({
    where: {
      id: params.id,
      hotelId: session.hotelId, // Multi-tenant isolation!
    },
    include: {
      hotel: true,
      categories: {
        orderBy: { orderIndex: "asc" },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!menu) {
    notFound();
  }

  return <MenuEditor initialMenu={menu as any} />;
}

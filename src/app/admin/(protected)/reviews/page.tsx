import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ReviewsClient from "./reviews-client";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const menus = await db.menu.findMany({
    where: { hotelId: session.hotelId },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReviewsClient
      menus={menus}
      userRole={session.role}
    />
  );
}

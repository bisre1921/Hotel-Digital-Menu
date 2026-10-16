import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MenuImportStudio } from "./import-studio";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const business = await db.hotel.findUnique({ where: { id: session.hotelId }, select: { id: true, currency: true } });
  if (!business) redirect("/admin/login");
  return <MenuImportStudio businessId={business.id} currency={business.currency} visionEnabled={Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MENU_MODEL)} />;
}

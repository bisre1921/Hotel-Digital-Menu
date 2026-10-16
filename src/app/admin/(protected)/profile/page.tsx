import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function HotelProfilePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const hotel = await db.hotel.findUnique({
    where: { id: session.hotelId },
  });

  if (!hotel) redirect("/admin/login");

  return <ProfileForm initialHotel={hotel as any} />;
}

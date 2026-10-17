import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const hotel = await db.hotel.findUnique({
    where: { id: session.hotelId },
    select: { id: true, name: true },
  });

  if (!hotel) redirect("/admin/login");

  return (
    <TeamClient
      hotelName={hotel.name}
      currentUser={{
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role as "OWNER" | "MANAGER" | "STAFF",
      }}
    />
  );
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hotelProfileSchema } from "@/validations";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    const hotel = await db.hotel.findUnique({
      where: { id: session.hotelId },
      include: {
        _count: {
          select: {
            menus: true,
            users: true,
          },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const validated = hotelProfileSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    if (validated.data.slug) {
      const conflict = await db.hotel.findFirst({
        where: {
          slug: validated.data.slug,
          NOT: { id: session.hotelId },
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json(
          { error: `The public address "${validated.data.slug}" is already taken.` },
          { status: 409 }
        );
      }
    }

    const updated = await db.hotel.update({
      where: { id: session.hotelId },
      data: validated.data,
    });

    return NextResponse.json({ success: true, hotel: updated });
  } catch (error) {
    console.error("Update hotel error:", error);
    return NextResponse.json({ error: "Failed to update hotel" }, { status: 500 });
  }
}

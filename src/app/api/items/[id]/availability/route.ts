import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));

    const item = await db.menuItem.findUnique({
      where: { id: params.id },
      include: { category: { include: { menu: true } } },
    });

    if (!item || item.category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const nextState =
      typeof body.isAvailable === "boolean" ? body.isAvailable : !item.isAvailable;

    const updated = await db.menuItem.update({
      where: { id: params.id },
      data: { isAvailable: nextState },
    });

    return NextResponse.json({
      success: true,
      isAvailable: updated.isAvailable,
      item: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle availability" }, { status: 500 });
  }
}

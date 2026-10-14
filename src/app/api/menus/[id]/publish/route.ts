import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));

    const menu = await db.menu.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const targetState =
      typeof body.isPublished === "boolean" ? body.isPublished : !menu.isPublished;

    const updated = await db.menu.update({
      where: { id: params.id },
      data: {
        isPublished: targetState,
        publishedAt: targetState && !menu.isPublished ? new Date() : menu.publishedAt,
      },
    });

    return NextResponse.json({
      success: true,
      isPublished: updated.isPublished,
      publishedAt: updated.publishedAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 500 });
  }
}

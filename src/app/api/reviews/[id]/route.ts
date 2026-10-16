import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireAuth(req);

    const review = await db.itemReview.findUnique({
      where: { id: params.id },
      include: {
        item: {
          include: {
            category: {
              include: {
                menu: true,
              },
            },
          },
        },
      },
    });

    if (!review || review.item.category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await db.itemReview.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}

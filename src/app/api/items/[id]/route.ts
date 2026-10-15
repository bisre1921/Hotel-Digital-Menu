import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { itemSchema } from "@/validations";

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const item = await db.menuItem.findUnique({
      where: { id: params.id },
      include: { category: { include: { menu: true } } },
    });

    if (!item || item.category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const validated = itemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const destination = await db.menuCategory.findFirst({
      where: { id: validated.data.categoryId, menu: { hotelId: session.hotelId } },
      select: { id: true },
    });
    if (!destination) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await db.menuItem.update({
      where: { id: params.id },
      data: {
        categoryId: validated.data.categoryId,
        name: validated.data.name,
        description: validated.data.description,
        price: validated.data.price,
        discountPrice: validated.data.discountPrice,
        imageUrl: validated.data.imageUrl,
        videoUrl: validated.data.videoUrl,
        isAvailable: validated.data.isAvailable,
        isChefSpecial: validated.data.isChefSpecial,
        isFeatured: validated.data.isFeatured,
        orderIndex: validated.data.orderIndex,
        calories: validated.data.calories,
        prepTimeMinutes: validated.data.prepTimeMinutes,
        dietaryTags: validated.data.dietaryTags,
        allergens: validated.data.allergens,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();

    const item = await db.menuItem.findUnique({
      where: { id: params.id },
      include: { category: { include: { menu: true } } },
    });

    if (!item || item.category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await db.menuItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { itemSchema, reorderSchema } from "@/validations";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const validated = itemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    // Verify category belongs to tenant
    const category = await db.menuCategory.findUnique({
      where: { id: validated.data.categoryId },
      include: { menu: true },
    });

    if (!category || category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Determine order index if not given
    let orderIndex = validated.data.orderIndex;
    if (!orderIndex) {
      const highest = await db.menuItem.findFirst({
        where: { categoryId: validated.data.categoryId },
        orderBy: { orderIndex: "desc" },
      });
      orderIndex = (highest?.orderIndex ?? 0) + 1;
    }

    const item = await db.menuItem.create({
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
        orderIndex,
        calories: validated.data.calories,
        prepTimeMinutes: validated.data.prepTimeMinutes,
        dietaryTags: validated.data.dietaryTags,
        allergens: validated.data.allergens,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const validated = reorderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    // Verify items belong to tenant
    for (const entry of validated.data.items) {
      const item = await db.menuItem.findUnique({
        where: { id: entry.id },
        include: { category: { include: { menu: true } } },
      });
      if (!item || item.category.menu.hotelId !== session.hotelId) {
        return NextResponse.json({ error: "Unauthorized access to item" }, { status: 403 });
      }
    }

    await db.$transaction(
      validated.data.items.map((entry) =>
        db.menuItem.update({
          where: { id: entry.id },
          data: { orderIndex: entry.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Items reordered" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}

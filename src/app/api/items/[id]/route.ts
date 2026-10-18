import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { itemSchema } from "@/validations";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await requireAuth(req);

    const item = await db.menuItem.findFirst({
      where: {
        id: params.id,
        category: {
          menu: {
            hotelId: session.hotelId,
          },
        },
      },
      include: {
        category: {
          include: {
            menu: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Compute average rating
    const ratingAggregate = await db.itemReview.aggregate({
      where: { itemId: params.id },
      _avg: { rating: true },
    });

    return NextResponse.json({
      ...item,
      averageRating: ratingAggregate._avg.rating || null,
      totalReviews: item._count.reviews,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireAuth(req);
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
        nameAm: validated.data.nameAm || null,
        description: validated.data.description,
        descriptionAm: validated.data.descriptionAm || null,
        price: validated.data.price,
        discountPrice: validated.data.discountPrice,
        variants: validated.data.variants ?? [],
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
    const session = await requireAuth(req);

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

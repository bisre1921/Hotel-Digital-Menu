import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { itemSchema, reorderSchema } from "@/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const menuId = searchParams.get("menuId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search")?.trim();
    const available = searchParams.get("available");
    const isChefSpecial = searchParams.get("isChefSpecial");
    const isFeatured = searchParams.get("isFeatured");
    const dietaryTag = searchParams.get("dietaryTag");
    const allergen = searchParams.get("allergen");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const where: any = {
      category: {
        menu: {
          hotelId: session.hotelId,
        },
      },
    };

    if (menuId) {
      where.category.menuId = menuId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (available === "true") where.isAvailable = true;
    if (available === "false") where.isAvailable = false;

    if (isChefSpecial === "true") where.isChefSpecial = true;
    if (isChefSpecial === "false") where.isChefSpecial = false;

    if (isFeatured === "true") where.isFeatured = true;
    if (isFeatured === "false") where.isFeatured = false;

    if (dietaryTag) {
      where.dietaryTags = { has: dietaryTag };
    }

    if (allergen) {
      where.allergens = { has: allergen };
    }

    const [total, items] = await Promise.all([
      db.menuItem.count({ where }),
      db.menuItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              menuId: true,
              menu: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: [{ categoryId: "asc" }, { orderIndex: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
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

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth(req);
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

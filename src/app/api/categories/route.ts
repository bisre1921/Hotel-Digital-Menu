import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema, reorderSchema } from "@/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("menuId");
    const includeItems = searchParams.get("includeItems") === "true";

    const where: any = {
      menu: { hotelId: session.hotelId },
    };

    if (menuId) {
      where.menuId = menuId;
    }

    const categories = await db.menuCategory.findMany({
      where,
      include: {
        menu: {
          select: { id: true, title: true, slug: true },
        },
        _count: {
          select: { items: true },
        },
        ...(includeItems
          ? {
              items: {
                orderBy: { orderIndex: "asc" },
              },
            }
          : {}),
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();
    const { menuId, ...rest } = body;

    if (!menuId) {
      return NextResponse.json({ error: "menuId is required" }, { status: 400 });
    }

    // Verify tenant ownership of the menu
    const menu = await db.menu.findFirst({
      where: { id: menuId, hotelId: session.hotelId },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const validated = categorySchema.safeParse(rest);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    // Determine order index if not specified
    let orderIndex = validated.data.orderIndex;
    if (!orderIndex) {
      const highest = await db.menuCategory.findFirst({
        where: { menuId },
        orderBy: { orderIndex: "desc" },
      });
      orderIndex = (highest?.orderIndex ?? 0) + 1;
    }

    const category = await db.menuCategory.create({
      data: {
        menuId,
        name: validated.data.name,
        description: validated.data.description,
        imageUrl: validated.data.imageUrl,
        isActive: validated.data.isActive,
        orderIndex,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
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

    // Verify all categories belong to tenant's menus
    for (const item of validated.data.items) {
      const cat = await db.menuCategory.findUnique({
        where: { id: item.id },
        include: { menu: true },
      });
      if (!cat || cat.menu.hotelId !== session.hotelId) {
        return NextResponse.json({ error: "Unauthorized access to category" }, { status: 403 });
      }
    }

    // Update in transaction
    await db.$transaction(
      validated.data.items.map((item) =>
        db.menuCategory.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Categories reordered successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}

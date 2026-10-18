import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/validations";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await requireAuth(req);

    const category = await db.menuCategory.findFirst({
      where: {
        id: params.id,
        menu: { hotelId: session.hotelId },
      },
      include: {
        menu: {
          select: { id: true, title: true, slug: true },
        },
        items: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const category = await db.menuCategory.findUnique({
      where: { id: params.id },
      include: { menu: true },
    });

    if (!category || category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const validated = categorySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const updated = await db.menuCategory.update({
      where: { id: params.id },
      data: {
        name: validated.data.name,
        nameAm: validated.data.nameAm || null,
        description: validated.data.description,
        descriptionAm: validated.data.descriptionAm || null,
        orderIndex: validated.data.orderIndex,
        imageUrl: validated.data.imageUrl,
        isActive: validated.data.isActive,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireAuth(req);

    const category = await db.menuCategory.findUnique({
      where: { id: params.id },
      include: { menu: true },
    });

    if (!category || category.menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await db.menuCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

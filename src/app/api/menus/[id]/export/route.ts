import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const shouldDownload = searchParams.get("download") === "true";

    const menu = await db.menu.findUnique({
      where: { id: params.id },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            currencySymbol: true,
          },
        },
        categories: {
          orderBy: { orderIndex: "asc" },
          include: {
            items: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    if (!menu || menu.hotelId !== session.hotelId) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const exportPayload = {
      version: "1.1",
      exportedAt: new Date().toISOString(),
      hotel: menu.hotel,
      menu: {
        id: menu.id,
        title: menu.title,
        slug: menu.slug,
        description: menu.description,
        isPublished: menu.isPublished,
        isDefault: menu.isDefault,
        activeStartTime: menu.activeStartTime,
        activeEndTime: menu.activeEndTime,
        activeDays: menu.activeDays,
        displayLayout: menu.displayLayout,
        headerImageUrl: menu.headerImageUrl,
      },
      categories: menu.categories.map((c) => ({
        id: c.id,
        name: c.name,
        nameAm: c.nameAm,
        description: c.description,
        descriptionAm: c.descriptionAm,
        orderIndex: c.orderIndex,
        isActive: c.isActive,
        items: c.items.map((i) => ({
          id: i.id,
          name: i.name,
          nameAm: i.nameAm,
          description: i.description,
          descriptionAm: i.descriptionAm,
          price: i.price,
          discountPrice: i.discountPrice,
          variants: i.variants,
          imageUrl: i.imageUrl,
          videoUrl: i.videoUrl,
          isAvailable: i.isAvailable,
          isChefSpecial: i.isChefSpecial,
          isFeatured: i.isFeatured,
          calories: i.calories,
          prepTimeMinutes: i.prepTimeMinutes,
          dietaryTags: i.dietaryTags,
          allergens: i.allergens,
          orderIndex: i.orderIndex,
        })),
      })),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (shouldDownload) {
      headers["Content-Disposition"] = `attachment; filename="${menu.slug}-menu-export.json"`;
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Export menu error:", error);
    return NextResponse.json({ error: "Failed to export menu" }, { status: 500 });
  }
}

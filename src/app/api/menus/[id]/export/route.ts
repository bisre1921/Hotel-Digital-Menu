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
      version: "1.0",
      exportedAt: new Date().toISOString(),
      hotel: menu.hotel,
      menu: {
        id: menu.id,
        title: menu.title,
        slug: menu.slug,
        description: menu.description,
        isPublished: menu.isPublished,
        displayLayout: menu.displayLayout,
        headerImageUrl: menu.headerImageUrl,
      },
      categories: menu.categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        orderIndex: c.orderIndex,
        isActive: c.isActive,
        items: c.items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          discountPrice: i.discountPrice,
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

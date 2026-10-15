import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQrSvg, buildPublicMenuUrl, buildStableMenuUrl } from "@/lib/qr";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();

    const original = await db.menu.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const newTitle = `${original.title} (Copy)`;
    let newSlug = `${original.slug}-copy`;
    let count = 1;
    while (await db.menu.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${original.slug}-copy-${count++}`;
    }

    const publicUrl = buildPublicMenuUrl(newSlug);
    const menuId = randomUUID();
    const qrCodeSvg = await generateQrSvg(buildStableMenuUrl(menuId));

    const duplicated = await db.$transaction(async (tx) => {
      const newMenu = await tx.menu.create({
        data: {
          id: menuId,
          hotelId: session.hotelId,
          title: newTitle,
          slug: newSlug,
          description: original.description,
          headerImageUrl: original.headerImageUrl,
          isPublished: false, // Start as draft
          displayLayout: original.displayLayout,
          currencyOverride: original.currencyOverride,
          qrCodeSvg,
        },
      });

      for (const cat of original.categories) {
        const newCat = await tx.menuCategory.create({
          data: {
            menuId: newMenu.id,
            name: cat.name,
            description: cat.description,
            orderIndex: cat.orderIndex,
            imageUrl: cat.imageUrl,
            isActive: cat.isActive,
          },
        });

        for (const item of cat.items) {
          await tx.menuItem.create({
            data: {
              categoryId: newCat.id,
              name: item.name,
              description: item.description,
              price: item.price,
              discountPrice: item.discountPrice,
              imageUrl: item.imageUrl,
              videoUrl: item.videoUrl,
              isAvailable: item.isAvailable,
              isChefSpecial: item.isChefSpecial,
              isFeatured: item.isFeatured,
              orderIndex: item.orderIndex,
              calories: item.calories,
              prepTimeMinutes: item.prepTimeMinutes,
              dietaryTags: item.dietaryTags,
              allergens: item.allergens,
            },
          });
        }
      }

      return newMenu;
    });

    return NextResponse.json({
      success: true,
      menu: {
        ...duplicated,
        publicUrl,
      },
    });
  } catch (error) {
    console.error("Duplicate menu error:", error);
    return NextResponse.json({ error: "Failed to duplicate menu" }, { status: 500 });
  }
}

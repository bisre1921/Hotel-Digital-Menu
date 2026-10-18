import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { generateQrSvg, buildPublicMenuUrl, buildStableMenuUrl } from "@/lib/qr";
import { normalizeItemVariants } from "@/lib/menu-helpers";

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const menuMeta = body?.menu;
    const rawCategories = Array.isArray(body?.categories)
      ? body.categories
      : Array.isArray(body?.menu?.categories)
      ? body.menu.categories
      : null;

    if (!menuMeta || typeof menuMeta.title !== "string" || !rawCategories) {
      return NextResponse.json(
        { error: "Invalid menu JSON backup format. Expected `menu` and `categories`." },
        { status: 400 }
      );
    }

    const baseTitle = menuMeta.title.trim() || "Restored Menu";
    const baseSlug = slugify(menuMeta.slug || baseTitle) || "restored-menu";
    let finalSlug = baseSlug;
    let count = 1;
    while (await db.menu.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const menuId = randomUUID();
    const publicUrl = buildPublicMenuUrl(finalSlug);
    const qrCodeSvg = await generateQrSvg(buildStableMenuUrl(menuId));

    const validLayouts = ["GRID", "LIST", "CARDS", "MAGAZINE"];
    const displayLayout = validLayouts.includes(menuMeta.displayLayout)
      ? menuMeta.displayLayout
      : "CARDS";

    const createdMenu = await db.$transaction(async (tx) => {
      const menu = await tx.menu.create({
        data: {
          id: menuId,
          hotelId: session.hotelId,
          title: baseTitle,
          slug: finalSlug,
          description: typeof menuMeta.description === "string" ? menuMeta.description : null,
          headerImageUrl: typeof menuMeta.headerImageUrl === "string" ? menuMeta.headerImageUrl : null,
          isPublished: Boolean(menuMeta.isPublished),
          publishedAt: menuMeta.isPublished ? new Date() : null,
          isDefault: false,
          activeStartTime: typeof menuMeta.activeStartTime === "string" ? menuMeta.activeStartTime : null,
          activeEndTime: typeof menuMeta.activeEndTime === "string" ? menuMeta.activeEndTime : null,
          activeDays: Array.isArray(menuMeta.activeDays)
            ? menuMeta.activeDays
                .map((d: unknown) => Number(d))
                .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
            : [],
          displayLayout,
          qrCodeSvg,
        },
      });

      let totalItems = 0;

      for (let cIdx = 0; cIdx < rawCategories.length; cIdx++) {
        const cat = rawCategories[cIdx];
        if (!cat || typeof cat.name !== "string" || !cat.name.trim()) continue;

        const createdCategory = await tx.menuCategory.create({
          data: {
            menuId: menu.id,
            name: cat.name.trim(),
            nameAm: typeof cat.nameAm === "string" && cat.nameAm.trim() ? cat.nameAm.trim() : null,
            description: typeof cat.description === "string" ? cat.description : null,
            descriptionAm:
              typeof cat.descriptionAm === "string" && cat.descriptionAm.trim()
                ? cat.descriptionAm.trim()
                : null,
            orderIndex: typeof cat.orderIndex === "number" ? cat.orderIndex : cIdx,
            isActive: typeof cat.isActive === "boolean" ? cat.isActive : true,
          },
        });

        const items = Array.isArray(cat.items) ? cat.items : [];
        for (let iIdx = 0; iIdx < items.length; iIdx++) {
          const item = items[iIdx];
          if (!item || typeof item.name !== "string" || !item.name.trim()) continue;
          const numericPrice = Number(item.price);
          if (!Number.isFinite(numericPrice) || numericPrice < 0) continue;

          const normalizedVariants = normalizeItemVariants(item.variants);

          await tx.menuItem.create({
            data: {
              categoryId: createdCategory.id,
              name: item.name.trim(),
              nameAm: typeof item.nameAm === "string" && item.nameAm.trim() ? item.nameAm.trim() : null,
              description: typeof item.description === "string" ? item.description : null,
              descriptionAm:
                typeof item.descriptionAm === "string" && item.descriptionAm.trim()
                  ? item.descriptionAm.trim()
                  : null,
              price: numericPrice,
              discountPrice:
                item.discountPrice !== null &&
                item.discountPrice !== undefined &&
                Number.isFinite(Number(item.discountPrice))
                  ? Number(item.discountPrice)
                  : null,
              variants: normalizedVariants.length > 0 ? normalizedVariants : undefined,
              imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
              videoUrl: typeof item.videoUrl === "string" ? item.videoUrl : null,
              isAvailable: typeof item.isAvailable === "boolean" ? item.isAvailable : true,
              isChefSpecial: Boolean(item.isChefSpecial),
              isFeatured: Boolean(item.isFeatured),
              calories:
                typeof item.calories === "number" && Number.isInteger(item.calories)
                  ? item.calories
                  : null,
              prepTimeMinutes:
                typeof item.prepTimeMinutes === "number" && Number.isInteger(item.prepTimeMinutes)
                  ? item.prepTimeMinutes
                  : null,
              dietaryTags: Array.isArray(item.dietaryTags)
                ? item.dietaryTags.filter((t: unknown) => typeof t === "string")
                : [],
              allergens: Array.isArray(item.allergens)
                ? item.allergens.filter((a: unknown) => typeof a === "string")
                : [],
              orderIndex: typeof item.orderIndex === "number" ? item.orderIndex : iIdx,
            },
          });
          totalItems++;
        }
      }

      return {
        ...menu,
        categoryCount: rawCategories.length,
        itemCount: totalItems,
        publicUrl,
      };
    });

    return NextResponse.json({
      success: true,
      menu: createdMenu,
    });
  } catch (error) {
    console.error("Import JSON menu error:", error);
    return NextResponse.json(
      { error: "Failed to restore menu from JSON backup" },
      { status: 500 }
    );
  }
}

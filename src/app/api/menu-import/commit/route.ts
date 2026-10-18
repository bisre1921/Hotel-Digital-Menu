import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { importCommitSchema } from "@/lib/menu-import";
import { buildStableMenuUrl, generateQrSvg } from "@/lib/qr";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session)
    return NextResponse.json(
      { error: "Sign in to save your import." },
      { status: 401 }
    );
  try {
    const parsed = importCommitSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Review every item, enter valid prices, and confirm approval before saving.",
        },
        { status: 400 }
      );
    const { title, items, importId, targetMenuId, brandUpdate } = parsed.data;
    const qrCodeSvg = await generateQrSvg(buildStableMenuUrl(importId));
    const hasDishPhotos = items.some((item) => Boolean(item.imageUrl || item.videoUrl));

    const normalizeKey = (val: string) =>
      val
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    const menu = await db.$transaction(async (tx) => {
      // Serialize retries: a double click or network retry must not create two menus.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${importId}))::text`;

      if (brandUpdate?.applyToHotel) {
        const hotelData: Record<string, string> = {};
        if (brandUpdate.businessName && brandUpdate.businessName.trim().length >= 2) {
          hotelData.name = brandUpdate.businessName.trim();
        }
        if (brandUpdate.tagline && brandUpdate.tagline.trim().length > 0) {
          hotelData.tagline = brandUpdate.tagline.trim();
        }
        if (brandUpdate.logoUrl && brandUpdate.logoUrl.trim().length > 0) {
          hotelData.logoUrl = brandUpdate.logoUrl.trim();
        }
        if (Object.keys(hotelData).length > 0) {
          await tx.hotel.update({
            where: { id: session.hotelId },
            data: hotelData,
          });
        }
      }

      // Re-Import / Merge into an existing menu
      if (targetMenuId) {
        const targetMenu = await tx.menu.findFirst({
          where: {
            id: targetMenuId,
            hotelId: session.hotelId,
          },
          include: {
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

        if (!targetMenu) {
          throw new Error("Target menu not found");
        }

        // Update title if changed
        if (title && title.trim() && title.trim() !== targetMenu.title) {
          await tx.menu.update({
            where: { id: targetMenu.id },
            data: { title: title.trim() },
          });
        }

        const categoryByKey = new Map(
          targetMenu.categories.map((cat) => [normalizeKey(cat.name), cat])
        );
        const itemByNameKey = new Map<
          string,
          { id: string; categoryId: string; price: number; description: string | null; imageUrl: string | null; videoUrl: string | null }
        >();
        for (const cat of targetMenu.categories) {
          for (const existingItem of cat.items) {
            itemByNameKey.set(normalizeKey(existingItem.name), {
              id: existingItem.id,
              categoryId: cat.id,
              price: Number(existingItem.price),
              description: existingItem.description,
              imageUrl: existingItem.imageUrl,
              videoUrl: existingItem.videoUrl,
            });
          }
        }

        let nextCatOrder = targetMenu.categories.length;

        for (const row of items) {
          const catKey = normalizeKey(row.category || "Menu");
          let catRecord = categoryByKey.get(catKey);
          if (!catRecord) {
            const createdCat = await tx.menuCategory.create({
              data: {
                menuId: targetMenu.id,
                name: row.category.trim() || "Menu",
                orderIndex: nextCatOrder++,
              },
              include: { items: true },
            });
            catRecord = createdCat;
            categoryByKey.set(catKey, createdCat);
          }

          const itemKey = normalizeKey(row.name);
          const matchedItem = itemByNameKey.get(itemKey);

          if (matchedItem) {
            await tx.menuItem.update({
              where: { id: matchedItem.id },
              data: {
                price: row.price,
                description:
                  row.description && row.description.trim()
                    ? row.description.trim()
                    : matchedItem.description,
                imageUrl: row.imageUrl || matchedItem.imageUrl,
                videoUrl: row.videoUrl || matchedItem.videoUrl,
              },
            });
          } else {
            const createdItem = await tx.menuItem.create({
              data: {
                categoryId: catRecord.id,
                name: row.name.trim(),
                description: row.description ? row.description.trim() : null,
                price: row.price,
                imageUrl: row.imageUrl || null,
                videoUrl: row.videoUrl || null,
                orderIndex: catRecord.items.length,
              },
            });
            itemByNameKey.set(itemKey, {
              id: createdItem.id,
              categoryId: catRecord.id,
              price: Number(createdItem.price),
              description: createdItem.description,
              imageUrl: createdItem.imageUrl,
              videoUrl: createdItem.videoUrl,
            });
          }
        }

        return { id: targetMenu.id };
      }

      const existing = await tx.menu.findUnique({
        where: { id: importId },
        select: { id: true, hotelId: true },
      });
      if (existing) {
        if (existing.hotelId !== session.hotelId)
          throw new Error("Import conflict");
        return existing;
      }

      const groups = new Map<string, typeof items>();
      for (const item of items)
        groups.set(item.category, [
          ...(groups.get(item.category) || []),
          item,
        ]);

      return tx.menu.create({
        data: {
          id: importId,
          hotelId: session.hotelId,
          title,
          slug: `${slugify(title).slice(0, 60) || "menu"}-${importId}`,
          isPublished: false,
          displayLayout: hasDishPhotos ? "CARDS" : "LIST",
          qrCodeSvg,
          categories: {
            create: Array.from(groups, ([name, rows], index) => ({
              name,
              orderIndex: index,
              items: {
                create: rows.map((row, orderIndex) => ({
                  name: row.name,
                  description: row.description || null,
                  price: row.price,
                  imageUrl: row.imageUrl || null,
                  videoUrl: row.videoUrl || null,
                  orderIndex,
                })),
              },
            })),
          },
        },
        select: { id: true },
      });
    });
    return NextResponse.json({ success: true, menuId: menu.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save the draft. Your review is still here; please try again.",
      },
      { status: 500 }
    );
  }
}

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
    const { title, items, importId, brandUpdate } = parsed.data;
    const qrCodeSvg = await generateQrSvg(buildStableMenuUrl(importId));
    const hasDishPhotos = items.some((item) => Boolean(item.imageUrl || item.videoUrl));

    const menu = await db.$transaction(async (tx) => {
      // Serialize retries: a double click or network retry must not create two menus.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${importId}))::text`;
      const existing = await tx.menu.findUnique({
        where: { id: importId },
        select: { id: true, hotelId: true },
      });
      if (existing) {
        if (existing.hotelId !== session.hotelId)
          throw new Error("Import conflict");
        return existing;
      }

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

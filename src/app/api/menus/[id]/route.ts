import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuSchema } from "@/validations";
import { generateQrSvg, buildPublicMenuUrl, buildStableMenuUrl } from "@/lib/qr";
import { slugify } from "@/lib/utils";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();

    const menu = await db.menu.findFirst({
      where: {
        id: params.id,
        hotelId: session.hotelId, // Multi-tenant isolation!
      },
      include: {
        hotel: true,
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

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...menu,
      publicUrl: buildPublicMenuUrl(menu.slug),
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const validated = menuSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    // Verify existing menu ownership
    const existing = await db.menu.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    let finalSlug = slugify(validated.data.slug);
    if (finalSlug !== existing.slug) {
      const conflict = await db.menu.findFirst({
        where: { slug: finalSlug, NOT: { id: params.id } },
      });
      if (conflict) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    // Re-generate QR if slug changed or if missing
    const qrCodeSvg = await generateQrSvg(buildStableMenuUrl(existing.id));
    const publicUrl = buildPublicMenuUrl(finalSlug);

    const updated = await db.menu.update({
      where: { id: params.id },
      data: {
        title: validated.data.title,
        slug: finalSlug,
        description: validated.data.description,
        headerImageUrl: validated.data.headerImageUrl,
        isPublished: validated.data.isPublished,
        publishedAt:
          validated.data.isPublished && !existing.isPublished
            ? new Date()
            : existing.publishedAt,
        displayLayout: validated.data.displayLayout,
        currencyOverride: validated.data.currencyOverride,
        qrCodeSvg,
      },
    });

    return NextResponse.json({
      success: true,
      menu: {
        ...updated,
        publicUrl,
      },
    });
  } catch (error) {
    console.error("Update menu error:", error);
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();

    const existing = await db.menu.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    await db.menu.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Menu deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
  }
}

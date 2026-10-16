import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuSchema } from "@/validations";
import { slugify } from "@/lib/utils";
import { generateQrSvg, buildPublicMenuUrl, buildStableMenuUrl } from "@/lib/qr";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const published = searchParams.get("published");
    const layout = searchParams.get("layout");

    const where: any = { hotelId: session.hotelId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (published === "true") {
      where.isPublished = true;
    } else if (published === "false") {
      where.isPublished = false;
    }

    if (layout) {
      where.displayLayout = layout;
    }

    const menus = await db.menu.findMany({
      where,
      include: {
        _count: {
          select: {
            categories: true,
          },
        },
        categories: {
          select: {
            _count: {
              select: { items: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedMenus = menus.map((menu) => {
      const totalItems = menu.categories.reduce(
        (sum, cat) => sum + cat._count.items,
        0
      );
      return {
        ...menu,
        categoryCount: menu._count.categories,
        itemCount: totalItems,
        publicUrl: buildPublicMenuUrl(menu.slug),
      };
    });

    return NextResponse.json(formattedMenus);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const validated = menuSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    let finalSlug = slugify(validated.data.slug);
    let count = 1;
    while (await db.menu.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slugify(validated.data.slug)}-${count++}`;
    }

    const menuId = randomUUID();
    const publicUrl = buildPublicMenuUrl(finalSlug);
    const qrCodeSvg = await generateQrSvg(buildStableMenuUrl(menuId));

    const newMenu = await db.menu.create({
      data: {
        id: menuId,
        hotelId: session.hotelId,
        title: validated.data.title,
        slug: finalSlug,
        description: validated.data.description,
        headerImageUrl: validated.data.headerImageUrl,
        isPublished: validated.data.isPublished,
        publishedAt: validated.data.isPublished ? new Date() : null,
        displayLayout: validated.data.displayLayout,
        currencyOverride: validated.data.currencyOverride,
        qrCodeSvg,
      },
    });

    return NextResponse.json({
      success: true,
      menu: {
        ...newMenu,
        publicUrl,
      },
    });
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 });
  }
}

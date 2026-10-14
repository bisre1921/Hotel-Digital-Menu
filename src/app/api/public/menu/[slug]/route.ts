import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface Params {
  params: { slug: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const isPreview = searchParams.get("preview") === "true";

    const menu = await db.menu.findUnique({
      where: { slug: params.slug },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            description: true,
            starRating: true,
            phone: true,
            email: true,
            website: true,
            address: true,
            city: true,
            country: true,
            logoUrl: true,
            coverImageUrl: true,
            primaryColor: true,
            accentColor: true,
            fontFamily: true,
            currency: true,
            currencySymbol: true,
          },
        },
        categories: {
          where: { isActive: true },
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

    // If unpublished, only allow if authenticated tenant owns it and preview is active
    if (!menu.isPublished && !isPreview) {
      return NextResponse.json(
        { error: "This menu is currently not published." },
        { status: 403 }
      );
    }

    if (!menu.isPublished && isPreview) {
      const session = await getSession();
      if (!session || session.hotelId !== menu.hotel.id) {
        return NextResponse.json(
          { error: "Unauthorized to preview this unpublished menu" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Public menu fetch error:", error);
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 });
  }
}

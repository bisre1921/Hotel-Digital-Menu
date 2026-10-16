import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const menuId = searchParams.get("menuId");
    const itemId = searchParams.get("itemId");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const search = searchParams.get("search")?.trim();

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10) || 25));
    const skip = (page - 1) * limit;

    const where: any = {
      item: {
        category: {
          menu: {
            hotelId: session.hotelId,
          },
        },
      },
    };

    if (itemId) {
      where.itemId = itemId;
    }

    if (menuId) {
      where.item.category.menuId = menuId;
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = parseInt(minRating, 10);
      if (maxRating) where.rating.lte = parseInt(maxRating, 10);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, reviews, summary] = await Promise.all([
      db.itemReview.count({ where }),
      db.itemReview.findMany({
        where,
        select: {
          id: true,
          name: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          itemId: true,
          item: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  menu: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.itemReview.aggregate({
        where: {
          item: {
            category: {
              menu: {
                hotelId: session.hotelId,
              },
            },
          },
        },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      summary: {
        totalAllReviews: summary._count._all,
        averageRating: summary._avg.rating ? Math.round(summary._avg.rating * 10) / 10 : null,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

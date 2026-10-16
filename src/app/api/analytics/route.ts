import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hotelId = session.hotelId;

    // Total menus & published menus
    const [totalMenus, publishedMenus] = await Promise.all([
      db.menu.count({ where: { hotelId } }),
      db.menu.count({ where: { hotelId, isPublished: true } }),
    ]);

    // Categories and Items count
    const menus = await db.menu.findMany({
      where: { hotelId },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
    });

    let totalItems = 0;
    let availableItems = 0;
    let chefSpecialCount = 0;

    menus.forEach((m) => {
      m.categories.forEach((c) => {
        c.items.forEach((item) => {
          totalItems++;
          if (item.isAvailable) availableItems++;
          if (item.isChefSpecial) chefSpecialCount++;
        });
      });
    });

    // Total QR scans and Page views
    const [totalScans, totalViews] = await Promise.all([
      db.analyticsEvent.count({
        where: { hotelId, type: "QR_SCAN" },
      }),
      db.analyticsEvent.count({
        where: { hotelId, type: "PAGE_VIEW" },
      }),
    ]);

    // Recent 7 days activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEvents = await db.$queryRaw<{ date: string; type: string; count: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             type, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE "hotelId" = ${hotelId}
        AND "createdAt" >= ${sevenDaysAgo}
        AND type IN ('QR_SCAN', 'PAGE_VIEW')
      GROUP BY date, type
    `;

    // Group events by day
    const daysMap: Record<string, { date: string; scans: number; views: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      daysMap[key] = { date: key, scans: 0, views: 0 };
    }

    recentEvents.forEach((ev) => {
      const key = ev.date;
      if (daysMap[key]) {
        if (ev.type === "QR_SCAN") daysMap[key].scans += ev.count;
        if (ev.type === "PAGE_VIEW") daysMap[key].views += ev.count;
      }
    });

    return NextResponse.json({
      metrics: {
        totalMenus,
        publishedMenus,
        totalItems,
        availableItems,
        chefSpecialCount,
        availabilityRate: totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 100,
        totalScans,
        totalViews,
      },
      chartData: Object.values(daysMap),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { menuSlug, type, itemId, metadata } = body;

    if (typeof menuSlug !== "string" || !["PAGE_VIEW", "QR_SCAN", "ITEM_VIEW", "SEARCH"].includes(type) || (itemId != null && typeof itemId !== "string")) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const menu = await db.menu.findUnique({
      where: { slug: menuSlug, isPublished: true },
      select: { id: true, hotelId: true },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    await db.analyticsEvent.create({
      data: {
        hotelId: menu.hotelId,
        menuId: menu.id,
        type: type, // "PAGE_VIEW" | "QR_SCAN" | "ITEM_VIEW" | "SEARCH"
        itemId: itemId || null,
        metadata: metadata ? String(metadata).slice(0, 200) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

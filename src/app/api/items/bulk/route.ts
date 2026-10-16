import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkItemActionSchema } from "@/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const validated = bulkItemActionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { action, itemIds } = validated.data;

    // Verify all items belong to this tenant's hotel
    const tenantItems = await db.menuItem.findMany({
      where: {
        id: { in: itemIds },
        category: {
          menu: {
            hotelId: session.hotelId,
          },
        },
      },
      select: {
        id: true,
        price: true,
        discountPrice: true,
      },
    });

    if (tenantItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: "One or more item IDs were not found or do not belong to your hotel" },
        { status: 404 }
      );
    }

    const verifiedIds = tenantItems.map((item) => item.id);

    if (action === "set_availability") {
      const { isAvailable } = validated.data;
      const result = await db.menuItem.updateMany({
        where: { id: { in: verifiedIds } },
        data: { isAvailable },
      });

      return NextResponse.json({
        success: true,
        action,
        count: result.count,
        message: `Updated availability to ${isAvailable ? "available" : "unavailable"} for ${result.count} items`,
      });
    }

    if (action === "move_category") {
      const { targetCategoryId } = validated.data;

      // Verify target category belongs to tenant
      const targetCategory = await db.menuCategory.findFirst({
        where: {
          id: targetCategoryId,
          menu: { hotelId: session.hotelId },
        },
      });

      if (!targetCategory) {
        return NextResponse.json(
          { error: "Target category not found in your hotel" },
          { status: 404 }
        );
      }

      const result = await db.menuItem.updateMany({
        where: { id: { in: verifiedIds } },
        data: { categoryId: targetCategoryId },
      });

      return NextResponse.json({
        success: true,
        action,
        count: result.count,
        targetCategoryId,
        message: `Moved ${result.count} items to category '${targetCategory.name}'`,
      });
    }

    if (action === "adjust_prices") {
      const { percentage, fixedAmount } = validated.data;

      if (percentage === undefined && fixedAmount === undefined) {
        return NextResponse.json(
          { error: "Either 'percentage' or 'fixedAmount' must be provided for adjust_prices" },
          { status: 400 }
        );
      }

      await db.$transaction(
        tenantItems.map((item) => {
          let newPrice = item.price;
          if (percentage !== undefined) {
            newPrice = newPrice * (1 + percentage / 100);
          }
          if (fixedAmount !== undefined) {
            newPrice = newPrice + fixedAmount;
          }
          newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

          let newDiscountPrice = item.discountPrice;
          if (newDiscountPrice != null) {
            if (percentage !== undefined) {
              newDiscountPrice = newDiscountPrice * (1 + percentage / 100);
            }
            if (fixedAmount !== undefined) {
              newDiscountPrice = newDiscountPrice + fixedAmount;
            }
            newDiscountPrice = Math.max(0, Math.round(newDiscountPrice * 100) / 100);
          }

          return db.menuItem.update({
            where: { id: item.id },
            data: {
              price: newPrice,
              discountPrice: newDiscountPrice,
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        action,
        count: tenantItems.length,
        message: `Adjusted prices for ${tenantItems.length} items`,
      });
    }

    if (action === "delete") {
      const result = await db.menuItem.deleteMany({
        where: { id: { in: verifiedIds } },
      });

      return NextResponse.json({
        success: true,
        action,
        count: result.count,
        message: `Deleted ${result.count} items`,
      });
    }

    if (action === "batch_assign_media") {
      const { assignments } = validated.data;
      const verifiedSet = new Set(verifiedIds);
      const validAssignments = assignments.filter((a) => verifiedSet.has(a.itemId));

      await db.$transaction(
        validAssignments.map((a) => {
          const data: { imageUrl?: string | null; videoUrl?: string | null } = {};
          if (a.imageUrl !== undefined) data.imageUrl = a.imageUrl;
          if (a.videoUrl !== undefined) data.videoUrl = a.videoUrl;
          return db.menuItem.update({
            where: { id: a.itemId },
            data,
          });
        })
      );

      return NextResponse.json({
        success: true,
        action,
        count: validAssignments.length,
        message: `Assigned matched photos/videos to ${validAssignments.length} dishes`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Bulk item operation error:", error);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}

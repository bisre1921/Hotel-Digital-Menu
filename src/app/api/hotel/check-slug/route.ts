import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hotelSlugSchema, RESERVED_SUBDOMAINS } from "@/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const rawSlug = (searchParams.get("slug") || "").trim().toLowerCase();

    if (!rawSlug) {
      return NextResponse.json({
        available: false,
        reason: "Enter a business address slug.",
      });
    }

    if ((RESERVED_SUBDOMAINS as readonly string[]).includes(rawSlug)) {
      return NextResponse.json({
        available: false,
        reason: `"${rawSlug}" is a reserved system address.`,
      });
    }

    const parsed = hotelSlugSchema.safeParse(rawSlug);
    if (!parsed.success) {
      return NextResponse.json({
        available: false,
        reason:
          parsed.error.issues[0]?.message ||
          "Use 3–48 lowercase letters, numbers, or hyphens.",
      });
    }

    const existing = await db.hotel.findFirst({
      where: {
        slug: rawSlug,
        NOT: { id: session.hotelId },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        reason: `"${rawSlug}" is already taken by another business.`,
      });
    }

    return NextResponse.json({
      available: true,
      slug: rawSlug,
      reason: "Available!",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

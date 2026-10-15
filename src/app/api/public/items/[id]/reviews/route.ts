import { createHmac, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJwtSecret } from "@/lib/auth";
import { reviewSchema, reviewPageSchema, REVIEW_PAGE_SIZE } from "@/lib/reviews";

export const dynamic = "force-dynamic";
const COOKIE = "menu_review_visitor";
const visible = (id: string) => ({ id, category: { isActive: true, menu: { isPublished: true } } });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const requested = reviewPageSchema.safeParse(new URL(req.url).searchParams.get("page") || "1");
  if (!requested.success) return NextResponse.json({ error: "Invalid review page." }, { status: 400 });
  try {
    const result = await db.$transaction(async (tx) => {
      if (!await tx.menuItem.findFirst({ where: visible(params.id), select: { id: true } })) return null;
      const summary = await tx.itemReview.aggregate({ where: { itemId: params.id }, _count: { _all: true }, _avg: { rating: true } });
      const total = summary._count._all;
      const pages = Math.max(1, Math.ceil(total / REVIEW_PAGE_SIZE));
      const page = Math.min(requested.data, pages);
      const reviews = await tx.itemReview.findMany({
        where: { itemId: params.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * REVIEW_PAGE_SIZE, take: REVIEW_PAGE_SIZE,
        select: { id: true, name: true, rating: true, comment: true, createdAt: true, updatedAt: true },
      });
      return { reviews, total, average: summary._avg.rating, page, pages };
    }, { isolationLevel: "RepeatableRead" });
    if (!result) return NextResponse.json({ error: "Dish not found." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load reviews. Please try again." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Submit your review from this menu." }, { status: 403 });
  try {
    const raw = await req.text();
    if (raw.length > 6000) return NextResponse.json({ error: "Your review is too long." }, { status: 413 });
    const parsed = reviewSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check your review." }, { status: 400 });
    const existingVisitor = cookies().get(COOKIE)?.value;
    const visitor = existingVisitor && /^[0-9a-f-]{36}$/i.test(existingVisitor) ? existingVisitor : randomUUID();
    const hash = (value: string) => createHmac("sha256", getJwtSecret()).update(value).digest("hex");
    const visitorHash = hash(`visitor:${visitor}`);
    // Configure the reverse proxy to overwrite forwarded headers. Only a keyed hash is stored.
    const clientHash = hash(`client:${req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || visitor}`);
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${clientHash}))::text`;
      if (!await tx.menuItem.findFirst({ where: visible(params.id), select: { id: true } })) return "missing";
      const recent = await tx.itemReview.count({ where: { clientHash, updatedAt: { gte: new Date(Date.now() - 3600000) } } });
      const previous = await tx.itemReview.findUnique({ where: { itemId_visitorHash: { itemId: params.id, visitorHash } } });
      if (recent >= 10 || previous && Date.now() - previous.updatedAt.getTime() < 30000) return "limited";
      await tx.itemReview.upsert({
        where: { itemId_visitorHash: { itemId: params.id, visitorHash } },
        create: { itemId: params.id, visitorHash, clientHash, ...parsed.data },
        update: { ...parsed.data, clientHash },
      });
      return "saved";
    });
    if (result === "missing") return NextResponse.json({ error: "This dish is not accepting reviews." }, { status: 404 });
    if (result === "limited") return NextResponse.json({ error: "Please wait before posting another review." }, { status: 429, headers: { "Retry-After": "30" } });
    const response = NextResponse.json({ success: true }, { status: 201 });
    response.cookies.set(COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not save your review. Please check it and try again." }, { status: 400 });
  }
}

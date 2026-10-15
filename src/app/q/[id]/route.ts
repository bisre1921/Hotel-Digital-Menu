import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildPublicMenuUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const menu = await db.menu.findFirst({ where: { id: params.id, isPublished: true }, select: { slug: true } });
  if (!menu) return new NextResponse("This menu is not currently available.", { status: 404, headers: { "Cache-Control": "no-store" } });
  // Temporary redirect, never cache: a future slug change or unpublish must take effect.
  const response = NextResponse.redirect(`${buildPublicMenuUrl(menu.slug)}?source=qr`, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

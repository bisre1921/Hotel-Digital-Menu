import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL || "";
  let host = "NOT_CONFIGURED";
  try {
    if (rawUrl) {
      const u = new URL(rawUrl.replace(/^["']|["']$/g, "").trim());
      host = u.host;
    }
  } catch (e: any) {
    host = `PARSE_ERROR: ${e.message}`;
  }

  return NextResponse.json({
    emailAndPassword: true,
    google: isGoogleAuthConfigured(),
    databaseHost: host,
  });
}

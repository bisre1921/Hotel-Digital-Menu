import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    emailAndPassword: true,
    google: isGoogleAuthConfigured(),
  });
}

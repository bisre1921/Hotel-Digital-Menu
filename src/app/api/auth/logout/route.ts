import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { auth } from "@/lib/better-auth";

export async function POST(req: Request) {
  try {
    await auth.api.signOut({
      headers: req.headers,
    });
  } catch {
    // Ignore if no active Better Auth session
  }
  await clearAuthCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signSessionToken, setAuthCookie } from "@/lib/auth";
import { auth, syncCredentialAccountForUser } from "@/lib/better-auth";
import { loginSchema } from "@/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        hotel: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password against User.passwordHash or Better Auth Account.password
    let passwordHashToVerify = user.passwordHash;
    if (!passwordHashToVerify) {
      const credAccount = await db.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });
      passwordHashToVerify = credAccount?.password || "";
    }

    if (!passwordHashToVerify) {
      return NextResponse.json(
        { error: "This account uses Google Sign-In. Please continue with Google." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, passwordHashToVerify);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Ensure Better Auth credential Account record is synced
    await syncCredentialAccountForUser({
      id: user.id,
      passwordHash: passwordHashToVerify,
    });

    // Trigger Better Auth signInEmail so Better Auth session cookie is set alongside JWT cookie
    try {
      await auth.api.signInEmail({
        body: {
          email: normalizedEmail,
          password,
        },
        headers: req.headers,
      });
    } catch {
      // Non-fatal if called in a headless test context
    }

    const token = await signSessionToken({
      userId: user.id,
      hotelId: user.hotelId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId,
      },
      hotel: {
        id: user.hotel.id,
        name: user.hotel.name,
        slug: user.hotel.slug,
        primaryColor: user.hotel.primaryColor,
        logoUrl: user.hotel.logoUrl,
      },
    });

    response.cookies.set("lux_hotel_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, details: String(error) },
      { status: 500 }
    );
  }
}

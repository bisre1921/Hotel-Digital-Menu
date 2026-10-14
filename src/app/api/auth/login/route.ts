import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signSessionToken, setAuthCookie } from "@/lib/auth";
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

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
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

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      userId: user.id,
      hotelId: user.hotelId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

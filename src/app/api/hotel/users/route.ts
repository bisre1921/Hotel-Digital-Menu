import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { createHotelUserSchema } from "@/validations";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireRole([Role.OWNER, Role.MANAGER], req);

    const users = await db.user.findMany({
      where: { hotelId: session.hotelId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Management access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch hotel team users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole([Role.OWNER, Role.MANAGER], req);
    const body = await req.json();

    const validated = createHotelUserSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name, role } = validated.data;

    // A manager cannot create an OWNER
    if (session.role === Role.MANAGER && role === Role.OWNER) {
      return NextResponse.json(
        { error: "Forbidden: Only hotel owners can assign the OWNER role" },
        { status: 403 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        hotelId: session.hotelId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        role,
        accounts: {
          create: {
            accountId: email.toLowerCase(),
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Management access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateHotelUserRoleSchema } from "@/validations";
import { Role } from "@prisma/client";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await requireRole([Role.OWNER, Role.MANAGER], req);

    const targetUser = await db.user.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message?.includes("Forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireRole([Role.OWNER, Role.MANAGER], req);
    const body = await req.json();

    const validated = updateHotelUserRoleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only OWNER can promote someone to OWNER or change an OWNER's role
    if (
      (targetUser.role === Role.OWNER || validated.data.role === Role.OWNER) &&
      session.role !== Role.OWNER
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only hotel owners can manage OWNER roles" },
        { status: 403 }
      );
    }

    const updated = await db.user.update({
      where: { id: params.id },
      data: { role: validated.data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message?.includes("Forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireRole([Role.OWNER, Role.MANAGER], req);

    if (params.id === session.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own active account" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findFirst({
      where: { id: params.id, hotelId: session.hotelId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // A manager cannot delete an OWNER
    if (targetUser.role === Role.OWNER && session.role !== Role.OWNER) {
      return NextResponse.json(
        { error: "Forbidden: Only owners can delete another owner" },
        { status: 403 }
      );
    }

    // Check if deleting the last owner
    if (targetUser.role === Role.OWNER) {
      const ownerCount = await db.user.count({
        where: { hotelId: session.hotelId, role: Role.OWNER },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the sole owner of the hotel" },
          { status: 400 }
        );
      }
    }

    await db.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message?.includes("Forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

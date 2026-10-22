import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { Role } from "@prisma/client";
import { auth } from "@/lib/better-auth";
import { db } from "@/lib/db";

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes");
  }
  return new TextEncoder().encode(secret);
}

export const AUTH_COOKIE_NAME = "lux_hotel_token";

export interface SessionPayload {
  userId: string;
  hotelId: string;
  email: string;
  role: Role;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    if (
      typeof payload.userId !== "string" || !payload.userId ||
      typeof payload.hotelId !== "string" || !payload.hotelId ||
      typeof payload.email !== "string" || typeof payload.name !== "string" ||
      !Object.values(Role).includes(payload.role as Role)
    ) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(req?: Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  // 1. Check passed Request Authorization header for Bearer JWT
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  // 2. Check next/headers() Authorization header if available
  let nextHeaderList: Headers | null = null;
  if (!token) {
    try {
      nextHeaderList = headers();
      const authHeader = nextHeaderList.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
      }
    } catch {
      // In contexts without header access
    }
  }

  // If an explicit Bearer token was provided, verify it first
  if (token) {
    const verified = await verifySessionToken(token);
    if (verified) return verified;
  }

  // 3. Check Better Auth session (supports Email/Password & Google Sign-In cookies)
  try {
    const reqHeaders = req ? req.headers : nextHeaderList || headers();
    const betterSession = await auth.api.getSession({
      headers: reqHeaders,
    });
    if (betterSession?.user?.id) {
      const sessionUser = betterSession.user as Record<string, unknown>;
      let hotelId = typeof sessionUser.hotelId === "string" ? sessionUser.hotelId : "";
      let role = (sessionUser.role as Role) || Role.OWNER;

      if (!hotelId || !Object.values(Role).includes(role)) {
        const dbUser = await db.user.findUnique({
          where: { id: betterSession.user.id },
          select: { hotelId: true, role: true },
        });
        if (dbUser) {
          hotelId = dbUser.hotelId;
          role = dbUser.role;
        }
      }

      if (hotelId) {
        return {
          userId: betterSession.user.id,
          hotelId,
          email: betterSession.user.email,
          name: betterSession.user.name,
          role,
        };
      }
    }
  } catch {
    // Fallback to legacy JWT cookie if Better Auth session check fails
  }

  // 4. Fallback to legacy JWT auth cookie
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // In contexts without cookie access
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(req?: Request): Promise<SessionPayload> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[], req?: Request): Promise<SessionPayload> {
  const session = await requireAuth(req);
  if (!allowedRoles.includes(session.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}

/**
 * Validates that the active session owns or has permission for the specified hotelId.
 * Guarantees strict multi-tenant boundary isolation.
 */
export async function verifyTenantOwnership(hotelId: string): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.hotelId !== hotelId) {
    throw new Error("Forbidden: Access restricted to hotel tenant");
  }
  return session;
}

export async function setAuthCookie(token: string) {
  try {
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch {
    // In environments where cookies() cannot be directly mutated
  }
}

export async function clearAuthCookie() {
  try {
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    // Also clear Better Auth session cookies if present
    for (const cookieName of [
      "better-auth.session_token",
      "__Secure-better-auth.session_token",
    ]) {
      cookieStore.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
  } catch {
    // In environments where cookies() cannot be directly mutated
  }
}

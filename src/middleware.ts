import { NextRequest, NextResponse } from "next/server";
import { tenantFromHost } from "@/lib/tenant-host";

export function middleware(request: NextRequest) {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!root) return NextResponse.next();
  const tenant = tenantFromHost(request.headers.get("host") || "", root);
  if (!tenant) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/business/${tenant}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/"] };

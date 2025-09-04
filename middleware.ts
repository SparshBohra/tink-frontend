import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Tenant Portal Subdomain
  if (host === "portal.squareft.ai") {
    if (!url.pathname.startsWith("/_next") && !url.pathname.startsWith("/api")) {
      if (url.pathname === "/") {
        url.pathname = "/tenant-login";
      }
      // Allow only tenant pages
      else if (!url.pathname.startsWith("/tenant-")) {
        url.pathname = "/tenant-login";
      }
      return NextResponse.rewrite(url);
    }
  }

  // App Subdomain
  if (host === "app.squareft.ai") {
    if (!url.pathname.startsWith("/_next") && !url.pathname.startsWith("/api")) {
      // Block tenant pages
      if (url.pathname.startsWith("/tenant-")) {
        url.pathname = "/app/login";
        return NextResponse.rewrite(url);
      }
      // Redirect root to /app/login
      if (url.pathname === "/") {
        url.pathname = "/app/login";
      } else if (!url.pathname.startsWith("/app")) {
        url.pathname = `/app${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }
  }

  // Root domain falls through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

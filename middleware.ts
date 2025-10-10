import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  
  // Extract subdomain (works for both localhost and production)
  const hostname = host.split(':')[0]; // Remove port for localhost
  const isPortalSubdomain = hostname.startsWith('portal.');
  const isAppSubdomain = hostname.startsWith('app.');

  // Skip middleware for static assets, API routes, and Next.js internals
  if (
    url.pathname.startsWith("/_next") || 
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/static") ||
    url.pathname.includes(".")  // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // Tenant Portal Subdomain (portal.localhost or portal.squareft.ai)
  if (isPortalSubdomain) {
    // Redirect root to tenant login
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL("/tenant-login", req.url));
    }
    // Block non-tenant pages
    if (!url.pathname.startsWith("/tenant-")) {
      return NextResponse.redirect(new URL("/tenant-login", req.url));
    }
    return NextResponse.next();
  }

  // App Subdomain (app.localhost or app.squareft.ai)
  if (isAppSubdomain) {
    // Block tenant pages
    if (url.pathname.startsWith("/tenant-")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Redirect root to login
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Root domain (localhost or squareft.ai) - Landing page only
  // Block app and tenant pages on root domain
  if (url.pathname.startsWith("/app") || url.pathname.startsWith("/tenant-") || url.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

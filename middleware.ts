import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Tenant Portal → map to tenant-specific routes
  if (host === "portal.squareft.ai") {
    if (!url.pathname.startsWith("/_next") && !url.pathname.startsWith("/api")) {
      // If accessing root, go directly to tenant login
      if (url.pathname === "/") {
        url.pathname = "/tenant-login";
      } else if (url.pathname === "/login") {
        // If accessing /login on portal subdomain, go to tenant login
        url.pathname = "/tenant-login";
      } else if (url.pathname === "/tenant-login") {
        // Keep tenant-login as is
        url.pathname = "/tenant-login";
      } else if (url.pathname === "/tenant-dashboard") {
        // Keep tenant-dashboard as is
        url.pathname = "/tenant-dashboard";
      } else if (url.pathname === "/tenant-payments") {
        // Keep tenant-payments as is
        url.pathname = "/tenant-payments";
      } else if (url.pathname === "/tenant-lease-portal") {
        // Keep tenant-lease-portal as is
        url.pathname = "/tenant-lease-portal";
      } else if (url.pathname === "/tenant-announcements") {
        // Keep tenant-announcements as is
        url.pathname = "/tenant-announcements";
      }
      return NextResponse.rewrite(url);
    }
  }

  // Main App → map to /app/* (landlord/manager only)
  if (host === "app.squareft.ai") {
    if (!url.pathname.startsWith("/_next") && !url.pathname.startsWith("/api")) {
      // Block access to tenant routes on app subdomain
      if (url.pathname.startsWith("/tenant-")) {
        url.pathname = "/app/login";
        return NextResponse.rewrite(url);
      }
      
      // If accessing root, go directly to app login
      if (url.pathname === "/") {
        url.pathname = "/app/login";
      } else if (!url.pathname.startsWith("/app")) {
        url.pathname = `/app${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }
  }

  // Landing (squareft.ai) falls through to existing routes
  return NextResponse.next();
}

// Avoid running middleware on static assets and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};

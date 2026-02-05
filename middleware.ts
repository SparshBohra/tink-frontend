import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified middleware - NO Supabase calls
// Auth is handled entirely client-side for speed

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Skip middleware for static assets and API routes
  if (
    url.pathname.startsWith("/_next") || 
    url.pathname.startsWith("/static") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Legacy routes - redirect to new dashboard
  const legacyDashboardRoutes = [
    '/landlord-dashboard',
    '/manager-dashboard',
    '/admin-dashboard',
    '/tenant-dashboard',
    '/properties',
    '/tenants',
    '/applications',
    '/leases',
    '/maintenance',
  ];

  if (legacyDashboardRoutes.some(route => url.pathname === route || url.pathname.startsWith(route + '/'))) {
    return NextResponse.redirect(new URL('/dashboard/tickets', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

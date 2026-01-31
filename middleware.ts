import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SquareFt Phase 1: Simplified middleware for Supabase Auth
// Auth protection is handled client-side by SupabaseAuthProvider
// This middleware only handles legacy route redirects

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Skip middleware for static assets, API routes, and Next.js internals
  if (
    url.pathname.startsWith("/_next") || 
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/static") ||
    url.pathname.includes(".")  // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // Legacy routes - redirect to new dashboard or auth pages
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
    // Redirect legacy dashboard routes to new dashboard
    return NextResponse.redirect(new URL('/dashboard/tickets', req.url));
  }
  
  // All other routes are handled normally
  // Auth protection for /dashboard/* is handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

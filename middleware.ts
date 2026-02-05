import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// SquareFt Phase 1: Middleware with Supabase SSR support
// Optimized to only refresh session when necessary

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Skip middleware for static assets, Next.js internals, and API routes
  if (
    url.pathname.startsWith("/_next") || 
    url.pathname.startsWith("/static") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes(".")  // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // Create response that we'll modify with cookie updates
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Only create Supabase client for auth-related routes or protected routes
  const needsAuthCheck = 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/auth/callback');
  
  if (needsAuthCheck) {
    // Create Supabase server client to refresh session and update cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Update request cookies
            cookiesToSet.forEach(({ name, value }) => {
              req.cookies.set(name, value);
            });
            // Create new response with updated cookies
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            // Set cookies on response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Only refresh session for protected routes - this is the slow call
    if (url.pathname.startsWith('/dashboard')) {
      await supabase.auth.getUser();
    }
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
  
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

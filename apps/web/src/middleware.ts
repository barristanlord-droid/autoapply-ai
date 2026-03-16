import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup"];

// Routes/prefixes that should always be accessible (static assets, API, etc.)
const alwaysAllowedPrefixes = ["/api", "/_next", "/favicon.ico"];

// Routes that authenticated users should be redirected away from
const authRoutes = ["/login", "/signup"];

// Routes under the (dashboard) group that require authentication
const protectedPrefixes = [
  "/dashboard",
  "/jobs",
  "/applications",
  "/analytics",
  "/chat",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets, API routes, and Next.js internals
  if (alwaysAllowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check for access_token in cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;

  // Redirect authenticated users away from login/signup to dashboard
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if the route is protected (under the dashboard group)
  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  // Redirect unauthenticated users trying to access protected routes to login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

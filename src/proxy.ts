import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Route access rules: maps route prefix → roles that are allowed
const ROUTE_ROLES: Record<string, string[]> = {
  "/settings": ["ADMIN"],
  "/countries": ["ADMIN", "MANAGER"],
  "/universities": ["ADMIN", "MANAGER"],
  "/reports": ["ADMIN", "MANAGER", "COUNSELOR"],
};

export const proxy = auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!session;
  const isAuthRoute = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // RBAC: check role-restricted routes
  if (isLoggedIn && session?.user) {
    const role = session.user.role as string;

    for (const [route, allowedRoles] of Object.entries(ROUTE_ROLES)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        const dashUrl = new URL("/dashboard", nextUrl.origin);
        dashUrl.searchParams.set("error", "access_denied");
        return NextResponse.redirect(dashUrl);
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

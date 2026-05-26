import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isAdminLoginPage = nextUrl.pathname === "/admin/login";
  const isAdminPage = nextUrl.pathname.startsWith("/admin") && !isAdminLoginPage;
  const isCustomerPage = !nextUrl.pathname.startsWith("/admin") && !nextUrl.pathname.startsWith("/api") && !isAuthPage;

  if (isAdminPage && (!isLoggedIn || !isAdmin)) return NextResponse.redirect(new URL("/admin/login", nextUrl));
  if (isAuthPage && isLoggedIn) return NextResponse.redirect(new URL(isAdmin ? "/admin/dashboard" : "/dashboard", nextUrl));
  if (isAdminLoginPage && isLoggedIn && isAdmin) return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
  if (isCustomerPage && !isLoggedIn && nextUrl.pathname !== "/") return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.webp$).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Guards every /system/* page: no session cookie -> straight to /login,
// before any page code runs. This only checks that the cookie EXISTS.
// Whether the token is actually valid or expired is still decided by the
// backend, and each page's own 401 handling still covers that case.
export function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/system/:path*"],
};
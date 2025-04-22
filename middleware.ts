import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { publicRoutes } from "./middleware.config"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth_token")?.value

  // Allow access to public routes
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/share/business-card/") // เพิ่มเส้นทางสำหรับแชร์นามบัตร
  ) {
    return NextResponse.next()
  }

  // Check if user is trying to access admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Additional admin role check can be added here if needed
    return NextResponse.next()
  }

  // Check if user is trying to access user routes
  if (pathname.startsWith("/user")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  }

  // Default behavior for other routes
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
}

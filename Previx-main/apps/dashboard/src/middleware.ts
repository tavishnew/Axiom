import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for authentication protection
 * Redirects unauthenticated users to sign-in page
 * Allows access to auth routes and API routes
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to auth routes
    if (pathname.startsWith("/auth")) {
        return NextResponse.next();
    }

    // Allow access to API routes
    if (pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Allow access to static files
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
        return NextResponse.next();
    }

    // Check for session cookie
    const sessionToken = request.cookies.get("better-auth.session_token");

    if (!sessionToken) {
        // Redirect to sign-in if no session
        const signInUrl = new URL("/auth/sign-in", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};

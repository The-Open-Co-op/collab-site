import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isHomePath = req.nextUrl.pathname.startsWith("/home");

  if (isHomePath && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/home/:path*"],
};

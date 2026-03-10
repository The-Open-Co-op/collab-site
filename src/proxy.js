import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export default async function proxy(req) {
  const token = req.cookies.get("session-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
}

export const config = {
  matcher: ["/home/:path*"],
};

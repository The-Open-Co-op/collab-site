import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { verifyToken } from "@/lib/otp";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return redirect("/login?error=missing-token");
  }

  const email = verifyToken(token);
  if (!email) {
    return redirect("/login?error=invalid-token");
  }

  // Create a session token
  const sessionToken = jwt.sign(
    { email, isMember: false },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "30d" }
  );

  // Check OC membership in background (non-blocking for the redirect)
  let isMember = false;
  try {
    const res = await fetch("https://api.opencollective.com/graphql/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OPEN_COLLECTIVE_API_KEY && {
          "Api-Key": process.env.OPEN_COLLECTIVE_API_KEY,
        }),
      },
      body: JSON.stringify({
        query: `
          query($slug: String!, $email: EmailAddress!) {
            account(slug: $slug) {
              members(email: $email, limit: 1) {
                nodes { role }
              }
            }
          }
        `,
        variables: { slug: "open-coop", email },
      }),
    });
    const data = await res.json();
    const members = data?.data?.account?.members?.nodes;
    isMember = members && members.length > 0;
  } catch {
    // Continue without membership status
  }

  // Re-sign with membership status
  const finalToken = jwt.sign(
    { email, isMember },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "30d" }
  );

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("session-token", finalToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return redirect("/home");
}

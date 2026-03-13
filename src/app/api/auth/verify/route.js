import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { verifyToken } from "@/lib/otp";
import { supabase } from "@/lib/supabase";

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

  // Look up member in Supabase
  let memberName = null;
  let isMember = false;

  const { data: member } = await supabase
    .from("members")
    .select("id, name")
    .eq("email", email)
    .limit(1)
    .single();

  if (member) {
    isMember = true;
    memberName = member.name;
  } else {
    // Fall back to OC membership check
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
                  nodes { role account { name slug } }
                }
              }
            }
          `,
          variables: { slug: "open-coop", email },
        }),
      });
      const data = await res.json();
      const members = data?.data?.account?.members?.nodes;
      if (members && members.length > 0) {
        isMember = true;
        memberName = members[0]?.account?.name;
        // Create the member in Supabase since they exist in OC but not locally
        await supabase
          .from("members")
          .insert({
            email,
            name: memberName,
            oc_slug: members[0]?.account?.slug,
          });
      }
    } catch (err) {
      console.error("OC membership check failed:", err.message);
    }
  }

  const payload = { email, isMember };
  if (memberName) payload.name = memberName;

  const finalToken = jwt.sign(payload, process.env.NEXTAUTH_SECRET, {
    expiresIn: "30d",
  });

  const cookieStore = await cookies();
  cookieStore.set("session-token", finalToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return redirect("/home");
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function findEmailByOrderId(orderIdV2) {
  const res = await fetch("https://api.opencollective.com/graphql/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query($orderId: String!) {
          order(order: { legacyId: $orderId }) {
            fromAccount { emails }
          }
        }
      `,
      variables: { orderId: orderIdV2 },
    }),
  });
  const data = await res.json();
  const emails = data?.data?.order?.fromAccount?.emails;
  return emails?.[0] || null;
}

async function checkNocoDB(email) {
  if (!process.env.NOCODB_API_TOKEN) return false;
  const res = await fetch(
    `https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records?where=(email,eq,${encodeURIComponent(email)})&limit=1`,
    {
      headers: { "xc-token": process.env.NOCODB_API_TOKEN },
    }
  );
  const { list } = await res.json();
  return list && list.length > 0;
}

function createSession(email) {
  return jwt.sign(
    { email, isMember: true },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "30d" }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, orderId } = body;

    // Try order-based sign-in first
    if (orderId) {
      const orderEmail = await findEmailByOrderId(orderId);
      if (orderEmail) {
        const sessionToken = createSession(orderEmail);
        const cookieStore = await cookies();
        cookieStore.set("session-token", sessionToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
        return NextResponse.json({ ok: true });
      }
      console.log("OC order lookup returned no email for", orderId);
    }

    // Fall back to email-based sign-in
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const exists = await checkNocoDB(email);
    if (!exists) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    const sessionToken = createSession(email);
    const cookieStore = await cookies();
    cookieStore.set("session-token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Quick sign-in error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

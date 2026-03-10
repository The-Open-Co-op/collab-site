import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req) {
  const session = await auth();
  const data = await req.json();

  if (process.env.NOCODB_API_TOKEN) {
    try {
      await fetch(
        "https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xc-token": process.env.NOCODB_API_TOKEN,
          },
          body: JSON.stringify({
            email: session?.user?.email || data.email,
            interests: Array.isArray(data.interests)
              ? data.interests.join(", ")
              : data.interests,
            skills: data.skills,
            time: data.time,
            contact_method: data.contact?.method,
            signal: data.contact?.signal,
            google_email: data.contact?.googleEmail,
            listed_on_members: data.contact?.listedOnMembers ?? false,
            membership_level: data.membership_level || "free",
          }),
        }
      );
    } catch (error) {
      console.error("NocoDB save error:", error.message);
    }
  } else {
    console.log("Profile data (NocoDB not configured):", JSON.stringify(data));
  }

  return NextResponse.json({ ok: true });
}

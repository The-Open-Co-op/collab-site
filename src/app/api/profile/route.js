import { NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();

  // Save to NocoDB if configured
  if (process.env.NOCODB_API_URL && process.env.NOCODB_API_TOKEN) {
    try {
      await fetch(process.env.NOCODB_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xc-token": process.env.NOCODB_API_TOKEN,
        },
        body: JSON.stringify({
          interests: Array.isArray(data.interests)
            ? data.interests.join(", ")
            : data.interests,
          skills: data.skills,
          time: data.time,
          contact_method: data.contact?.method,
          signal: data.contact?.signal,
          google_email: data.contact?.googleEmail,
          listed_on_members: data.contact?.listedOnMembers,
        }),
      });
    } catch (error) {
      console.error("NocoDB save error:", error.message);
    }
  } else {
    console.log("Profile data (NocoDB not configured):", JSON.stringify(data));
  }

  return NextResponse.json({ ok: true });
}

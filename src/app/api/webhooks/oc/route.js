import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const event = await req.json();
    console.log("OC webhook received:", JSON.stringify(event));

    const email =
      event.data?.member?.memberAccount?.email ||
      event.data?.member?.account?.email ||
      event.data?.fromCollective?.email ||
      event.data?.email;

    if (!email) {
      console.log("OC webhook: no email found in payload");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const name =
      event.data?.member?.memberAccount?.name ||
      event.data?.member?.account?.name ||
      event.data?.fromCollective?.name;

    const slug =
      event.data?.member?.memberAccount?.slug ||
      event.data?.member?.account?.slug ||
      event.data?.fromCollective?.slug;

    const tierName =
      event.data?.member?.tier?.name ||
      event.data?.tier?.name ||
      event.data?.order?.tier?.name ||
      "free";

    // Upsert member — create if new, update tier if existing
    const { error } = await supabase.from("members").upsert(
      {
        email,
        name: name || undefined,
        oc_slug: slug || undefined,
        oc_tier: tierName.toLowerCase(),
      },
      { onConflict: "email", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Supabase upsert error:", error.message);
    } else {
      console.log("OC webhook: upserted member", email);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OC webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { helpRequestId } = await req.json();
  if (!helpRequestId) {
    return NextResponse.json(
      { error: "helpRequestId required" },
      { status: 400 }
    );
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { error } = await supabase.from("help_replies").upsert(
    { help_request_id: helpRequestId, member_id: member.id },
    { onConflict: "help_request_id,member_id" }
  );

  if (error) {
    console.error("Help reply error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

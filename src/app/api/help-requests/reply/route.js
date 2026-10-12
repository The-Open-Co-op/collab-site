import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { helpRequestId, message } = await req.json();
  if (!helpRequestId) {
    return NextResponse.json(
      { error: "helpRequestId required" },
      { status: 400 }
    );
  }

  const text = typeof message === "string" ? message.trim() : "";

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // A member can leave as many written replies as they like, but only one
  // "I can help" flag (a reply with no message) per request.
  if (!text) {
    const { data: existing } = await supabase
      .from("help_replies")
      .select("id")
      .eq("help_request_id", helpRequestId)
      .eq("member_id", member.id)
      .is("message", null)
      .limit(1);

    if (existing?.length) {
      return NextResponse.json({ ok: true });
    }
  }

  const { data: reply, error } = await supabase
    .from("help_replies")
    .insert({
      help_request_id: helpRequestId,
      member_id: member.id,
      ...(text && { message: text }),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Help reply error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: reply?.id });
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, role")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Your own reply, or anything if you're core team.
  let query = supabase.from("help_replies").delete().eq("id", id);
  if (member.role !== "core team") {
    query = query.eq("member_id", member.id);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

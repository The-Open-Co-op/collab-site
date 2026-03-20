import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, role")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (member?.role !== "contributor") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { feedback_id, message } = await req.json();
  if (!feedback_id || !message) {
    return NextResponse.json({ error: "feedback_id and message required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feedback_replies")
    .insert({ feedback_id, member_id: member.id, message })
    .select("*, members(name, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, role")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (member?.role !== "contributor") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const { error } = await supabase.from("feedback_replies").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

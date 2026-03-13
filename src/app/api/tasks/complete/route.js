import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { taskId } = await req.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
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

  const { error } = await supabase.from("task_completions").upsert(
    { member_id: member.id, task_id: taskId },
    { onConflict: "member_id,task_id" }
  );

  if (error) {
    console.error("Task completion error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { taskId } = await req.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
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

  await supabase
    .from("task_completions")
    .delete()
    .eq("member_id", member.id)
    .eq("task_id", taskId);

  return NextResponse.json({ ok: true });
}

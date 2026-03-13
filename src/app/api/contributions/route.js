import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { description, mentionedMembers } = await req.json();
  if (!description) {
    return NextResponse.json(
      { error: "description required" },
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

  const { error } = await supabase.from("contributions").insert({
    member_id: member.id,
    description,
    mentioned_members: mentionedMembers || [],
  });

  if (error) {
    console.error("Contribution error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, description } = await req.json();

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Delete by id if numeric, otherwise match by description + member
  if (id && !isNaN(id)) {
    await supabase
      .from("contributions")
      .delete()
      .eq("id", id)
      .eq("member_id", member.id);
  } else if (description) {
    // For optimistic items where we don't have the DB id yet
    const { data } = await supabase
      .from("contributions")
      .select("id")
      .eq("member_id", member.id)
      .eq("description", description)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data?.[0]) {
      await supabase.from("contributions").delete().eq("id", data[0].id);
    }
  }

  return NextResponse.json({ ok: true });
}

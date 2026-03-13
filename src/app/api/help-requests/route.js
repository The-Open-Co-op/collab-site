import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { description } = await req.json();
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

  const { error } = await supabase.from("help_requests").insert({
    member_id: member.id,
    description,
  });

  if (error) {
    console.error("Help request error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: rows, error } = await supabase
    .from("help_requests")
    .select("*, members(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Help requests GET error:", error);
    return NextResponse.json({ requests: [] });
  }

  // Fetch replies separately to avoid ambiguous nested members join
  const ids = (rows || []).map((r) => r.id);
  let repliesMap = {};
  if (ids.length > 0) {
    const { data: replies } = await supabase
      .from("help_replies")
      .select("*, members(name)")
      .in("help_request_id", ids);
    for (const reply of replies || []) {
      if (!repliesMap[reply.help_request_id]) repliesMap[reply.help_request_id] = [];
      repliesMap[reply.help_request_id].push(reply);
    }
  }

  const requests = (rows || []).map((r) => ({
    ...r,
    help_replies: repliesMap[r.id] || [],
  }));

  return NextResponse.json(
    { requests },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

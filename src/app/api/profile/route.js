import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  const data = await req.json();
  const memberEmail = session?.user?.email || data.email;

  if (!memberEmail) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const updates = {};

    if (data.interests !== undefined) {
      updates.interests = Array.isArray(data.interests)
        ? data.interests
        : [data.interests];
    }
    if (data.skills !== undefined) {
      updates.skills = Array.isArray(data.skills)
        ? data.skills
        : data.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (data.time !== undefined) updates.time_commitment = data.time;
    if (data.time_commitment !== undefined) updates.time_commitment = data.time_commitment;
    if (data.name !== undefined) updates.name = data.name;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
    if (data.links !== undefined) updates.links = data.links;
    if (data.show_contact_details !== undefined)
      updates.show_contact_details = data.show_contact_details;
    if (data.onboarding_completed !== undefined)
      updates.onboarding_completed = data.onboarding_completed;

    const { error } = await supabase
      .from("members")
      .update(updates)
      .eq("email", memberEmail);

    if (error) {
      console.error("Supabase profile update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Profile save error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

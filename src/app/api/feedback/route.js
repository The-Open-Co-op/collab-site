import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

async function getMember(email) {
  const { data } = await supabase
    .from("members")
    .select("id, role")
    .eq("email", email)
    .limit(1)
    .single();
  return data;
}

export async function GET(req) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const demoSlug = searchParams.get("demo_slug");

  // Demo feedback is public; general feedback requires auth
  if (!demoSlug && !session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const member = session?.user?.email ? await getMember(session.user.email) : null;

  let query = supabase
    .from("feedback")
    .select("*, members(name, avatar_url), feedback_replies(*, members(name, avatar_url))")
    .order("created_at", { ascending: false })
    .limit(100);

  if (demoSlug) {
    query = query.eq("demo_slug", demoSlug);
    const demoStep = searchParams.get("demo_step");
    if (demoStep) {
      query = query.eq("demo_step", demoStep);
    }
  } else {
    query = query.neq("category", "demo");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data, isContributor: member?.role === "core team" });
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const member = await getMember(session.user.email);
  const isContributor = member?.role === "core team";

  if (!isContributor) {
    const { data: feedback } = await supabase
      .from("feedback")
      .select("email")
      .eq("id", id)
      .single();

    if (feedback?.email !== session.user.email) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req) {
  const session = await auth();
  const { category, message, demo_slug, demo_step, demo_step_title } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const email = session?.user?.email;

  // Look up member ID if authenticated
  let memberId = null;
  if (email) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();
    memberId = member?.id;
  }

  // Save to Supabase
  const { error: dbError } = await supabase.from("feedback").insert({
    member_id: memberId,
    email,
    category: category || null,
    message,
    demo_slug: demo_slug || null,
    demo_step: demo_step || null,
    demo_step_title: demo_step_title || null,
  });

  if (dbError) {
    console.error("Feedback save error:", dbError.message);
  }

  // Email to info@open.coop
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });

    await transporter.sendMail({
      from: "Collab <info@open.coop>",
      ...(email && { replyTo: email }),
      to: "info@open.coop",
      subject: `Collab feedback${category ? ` [${category}]` : ""}${demo_slug ? ` — ${demo_slug}` : ""}`,
      text: `From: ${email || "anonymous"}\nCategory: ${category || "none"}${demo_slug ? `\nDemo: ${demo_slug}` : ""}${demo_step_title ? `\nStep: ${demo_step_title}` : ""}\n\n${message}`,
    });
  } catch (err) {
    console.error("Feedback email error:", err.message);
  }

  return NextResponse.json({ ok: true });
}

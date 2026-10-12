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
    // Replies oldest-first so the most recent reply sits at the bottom of the thread.
    .order("created_at", { referencedTable: "feedback_replies", ascending: true })
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

/**
 * Simple in-memory per-IP throttle for the one publicly postable category.
 * Resets on cold start — enough to stop a script hammering the endpoint,
 * not a substitute for a real rate limiter if abuse continues.
 */
const JOIN_POST_WINDOW_MS = 60 * 60 * 1000;
const JOIN_POST_LIMIT = 3;
const joinPostLog = new Map();

function joinRateLimited(ip) {
  const now = Date.now();
  const recent = (joinPostLog.get(ip) || []).filter((t) => now - t < JOIN_POST_WINDOW_MS);
  if (recent.length >= JOIN_POST_LIMIT) {
    joinPostLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  joinPostLog.set(ip, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (joinPostLog.size > 5000) {
    for (const [key, times] of joinPostLog) {
      if (!times.some((t) => now - t < JOIN_POST_WINDOW_MS)) joinPostLog.delete(key);
    }
  }
  return false;
}

export async function POST(req) {
  const session = await auth();
  const body = await req.json();
  const { category, message, demo_slug, demo_step, demo_step_title } = body;

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Everything except the join flow is posted from logged-in UI (the members'
  // feedback page, and the demo panel, which only shows its form to members).
  // The page gating doesn't protect this route handler, so enforce it here.
  const isJoinFeedback = category === "join-feedback";
  if (!session?.user?.email && !isJoinFeedback) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isJoinFeedback) {
    // Honeypot: a real browser leaves this hidden field empty.
    if (body.website) {
      return NextResponse.json({ ok: true });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (joinRateLimited(ip)) {
      return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
    }
  }

  // Signed-in identity wins; the join form may supply one for a visitor.
  const bodyEmail = typeof body.email === "string" ? body.email.trim() : "";
  const email =
    session?.user?.email || (isJoinFeedback && bodyEmail.includes("@") ? bodyEmail : undefined);

  // Look up member ID if authenticated
  let memberId = null;
  if (session?.user?.email) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("email", session.user.email)
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

    // Where it was posted, and the page to reply on — so the notification
    // says which form this came from and links straight back to the thread.
    const where = demo_slug
      ? `Demo feedback panel — ${demo_slug}${demo_step_title ? ` · ${demo_step_title}` : ""}`
      : category === "join-feedback"
        ? "Join flow feedback form"
        : `Members' feedback page${category ? ` — ${category}` : ""}`;
    const replyUrl = demo_slug
      ? `https://collab.open.coop/demo/${demo_slug}`
      : "https://collab.open.coop/home/feedback";

    await transporter.sendMail({
      from: "Collab <info@open.coop>",
      ...(email && { replyTo: email }),
      to: "info@open.coop",
      subject: `Collab feedback${category ? ` [${category}]` : ""}${demo_slug ? ` — ${demo_slug}` : ""}`,
      text: [
        `From: ${email || "anonymous"}`,
        `Posted on: ${where}`,
        "",
        message,
        "",
        "---",
        "Reply on Collab — your reply is saved in the thread and emailed to them:",
        replyUrl,
      ].join("\n"),
    });
  } catch (err) {
    console.error("Feedback email error:", err.message);
  }

  return NextResponse.json({ ok: true });
}

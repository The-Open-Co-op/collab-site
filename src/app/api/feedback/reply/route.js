import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
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

  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
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

  // Notify the original commenter by email
  try {
    const { data: feedback } = await supabase
      .from("feedback")
      .select("email, message, demo_slug")
      .eq("id", feedback_id)
      .single();

    if (feedback?.email && feedback.email !== session.user.email) {
      const replierName = data.members?.name || "Someone";
      const demoLabel = feedback.demo_slug ? ` on ${feedback.demo_slug}` : "";

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
        to: feedback.email,
        subject: `${replierName} replied to your feedback${demoLabel}`,
        text: [
          `${replierName} replied to your feedback${demoLabel}:`,
          "",
          `"${message}"`,
          "",
          "---",
          "Your original comment:",
          feedback.message,
          "",
          "View the demo: https://collab.open.coop/demo/" + (feedback.demo_slug || ""),
        ].join("\n"),
      });
    }
  } catch (err) {
    console.error("Reply notification email error:", err.message);
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

  if (member?.role !== "core team") {
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

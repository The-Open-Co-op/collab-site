import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateToken } from "@/lib/otp";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check membership via NocoDB
    if (process.env.NOCODB_API_TOKEN) {
      try {
        const nocoRes = await fetch(
          `https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records?where=(email,eq,${encodeURIComponent(email)})&limit=1`,
          {
            headers: { "xc-token": process.env.NOCODB_API_TOKEN },
          }
        );
        const { list } = await nocoRes.json();
        if (!list || list.length === 0) {
          return NextResponse.json(
            { error: "not_a_member" },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error("NocoDB membership check failed:", err.message);
        // Allow sign-in if check fails
      }
    }

    const token = generateToken(email);
    const baseUrl = process.env.NEXTAUTH_URL || "https://planet.open.coop";
    const magicLink = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_API_KEY,
      },
    });

    await transporter.sendMail({
      from: "PLANET <info@open.coop>",
      to: email,
      subject: "Sign in to The Open Co-op",
      text: `Sign in to The Open Co-op\n\nClick the link below to sign in.\n\n${magicLink}\n\nThis link expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 16px 0;">Sign in to The Open Co-op</p>
          <p style="font-size: 13px; color: #666; margin: 0 0 24px 0;">Click the button below to sign in.</p>
          <a href="${magicLink}" style="display: inline-block; background: #0066CC; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Sign in</a>
          <p style="font-size: 11px; color: #999; margin: 24px 0 0 0;">This link expires in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Send link error:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return NextResponse.json(
      { error: `Failed to send link: ${error.message}` },
      { status: 500 }
    );
  }
}

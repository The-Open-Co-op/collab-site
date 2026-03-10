import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateToken } from "@/lib/otp";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
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
      from: "PLANET <noreply@open.coop>",
      to: email,
      subject: "Sign in to PLANET",
      text: `Click this link to sign in to PLANET:\n\n${magicLink}\n\nThis link expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px;">
          <h2>Sign in to PLANET</h2>
          <p>Click the button below to sign in. This link expires in 10 minutes.</p>
          <a href="${magicLink}" style="display: inline-block; background: #0066CC; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0;">Sign in</a>
          <p style="color: #666; font-size: 14px;">Or copy this link: ${magicLink}</p>
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

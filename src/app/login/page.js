"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await signIn("nodemailer", { email, callbackUrl: "/home" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold mb-2">Sign in</h1>
        <p className="text-foreground/60 mb-8">
          Enter your email and we&apos;ll send you a magic link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>
        <p className="mt-6 text-sm text-foreground/50 text-center">
          You need to be a member of{" "}
          <a
            href="https://opencollective.com/the-open-co-op"
            className="text-primary hover:underline"
          >
            The Open Co-op
          </a>{" "}
          to access the member home.
        </p>
      </div>
    </div>
  );
}

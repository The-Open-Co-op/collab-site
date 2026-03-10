"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send link");

      setSent(true);
    } catch (err) {
      setError(err.message || "Could not send link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl font-bold mb-4">
            Check your email
          </h1>
          <p className="text-foreground/60">
            We sent a sign-in link to <strong>{email}</strong>
          </p>
          <p className="mt-4 text-sm text-foreground/40">
            Click the link in the email to sign in. It expires in 10 minutes.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setError("");
            }}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold mb-2">Sign in</h1>
        <p className="text-foreground/60 mb-8">
          Enter your email and we&apos;ll send you a sign-in link.
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
            {loading ? "Sending..." : "Send sign-in link"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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

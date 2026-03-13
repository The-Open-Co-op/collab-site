"use client";

import { useState } from "react";

const categories = [
  { label: "Collab site", value: "collab" },
  { label: "PLANET product", value: "planet" },
  { label: "Governance", value: "governance" },
  { label: "Other", value: "other" },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setSent(true);
      setMessage("");
      setCategory("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-3xl font-bold mb-4">Thank you!</h1>
        <p className="text-foreground/60 mb-6">
          Your feedback has been sent. We really appreciate you taking the time.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-primary hover:underline"
        >
          Send more feedback
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl font-bold mb-2">
        Feedback & Questions
      </h1>
      <p className="text-foreground/50 mb-8">
        About Collab, the co-op, PLANET, or anything else. We read everything.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Category (optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Select a category...</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="What's on your mind?"
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send feedback"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

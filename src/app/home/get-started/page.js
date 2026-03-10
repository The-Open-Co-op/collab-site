"use client";

import { useState } from "react";

const interestOptions = [
  "Building the apps (design, code, prototyping)",
  "Writing and communication (docs, blog posts, outreach)",
  "Community organising (recruiting communities, onboarding)",
  "Governance (shaping how the co-op works)",
  "Business and strategy (funding, partnerships, sustainability)",
  "I just want to follow along for now",
];

const timeOptions = [
  "A few hours a month",
  "A few hours a week",
  "I want to be deeply involved",
  "Just keep me informed",
];

const skillSuggestions = [
  "development", "design", "UX", "writing", "marketing",
  "community organising", "project management", "legal",
  "finance", "translation", "testing",
];

function nextSteps(interests) {
  const steps = [];

  if (interests.includes("Building the apps (design, code, prototyping)")) {
    steps.push({ text: "Browse open issues", href: "https://github.com/The-Open-Co-op/planet/issues" });
    steps.push({ text: "Read the app specs", href: "https://docs.open.coop/planet/technology" });
  }
  if (interests.includes("Writing and communication (docs, blog posts, outreach)")) {
    steps.push({ text: "Pick a docs page that needs writing", href: "https://docs.open.coop/contributing" });
  }
  if (interests.includes("Community organising (recruiting communities, onboarding)")) {
    steps.push({ text: "Read about founding communities", href: "https://docs.open.coop/planet/how-it-works" });
    steps.push({ text: "Share planet.open.coop with a community you're part of", href: "https://planet.open.coop" });
  }
  if (interests.includes("Governance (shaping how the co-op works)")) {
    steps.push({ text: "View active proposals on Loomio", href: "https://www.loomio.com/the-open-co-op" });
  }
  if (interests.includes("Business and strategy (funding, partnerships, sustainability)")) {
    steps.push({ text: "Read the roadmap", href: "https://docs.open.coop/planet/roadmap" });
    steps.push({ text: "View finances on Open Collective", href: "https://opencollective.com/open-coop" });
  }
  if (interests.includes("I just want to follow along for now")) {
    steps.push({ text: "You're all set — we'll keep you updated. Check back anytime.", href: null });
  }

  if (steps.length === 0) {
    steps.push({ text: "Check the dashboard for what needs help", href: "/home" });
  }

  return steps;
}

export default function GetStartedPage() {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState({
    method: "email",
    signal: "",
    googleDocs: false,
    googleEmail: "",
    listedOnMembers: false,
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggleInterest(option) {
    setInterests((prev) =>
      prev.includes(option)
        ? prev.filter((i) => i !== option)
        : [...prev, option]
    );
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, skills, time, contact }),
      });
    } catch {
      // Save failed — continue anyway, data is not critical
    }
    setSaving(false);
    setDone(true);
  }

  if (done) {
    const steps = nextSteps(interests);
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-3xl font-bold mb-6">Your next steps</h1>
        <ul className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              {s.href ? (
                <a
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-primary hover:underline"
                >
                  {s.text}
                </a>
              ) : (
                <span className="text-foreground/70">{s.text}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-bold mb-8">Get Started</h1>

      {step === 1 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            What interests you most?
          </h2>
          <div className="space-y-2">
            {interestOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleInterest(option)}
                className={`block w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                  interests.includes(option)
                    ? "border-primary bg-primary/5"
                    : "border-foreground/10 bg-white hover:border-foreground/20"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={interests.length === 0}
            className="mt-6 rounded-lg bg-primary px-6 py-2 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            What skills can you offer?
          </h2>
          <textarea
            placeholder="e.g. React, UX design, copywriting..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none h-24"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {skillSuggestions.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setSkills((prev) =>
                    prev ? `${prev}, ${tag}` : tag
                  )
                }
                className="rounded-full border border-foreground/10 px-3 py-1 text-xs hover:border-primary transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-foreground/20 px-6 py-2 text-sm hover:bg-foreground/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:bg-primary-dark transition-colors"
            >
              {skills ? "Next" : "Skip"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            How much time?
          </h2>
          <div className="space-y-2">
            {timeOptions.map((option) => (
              <button
                key={option}
                onClick={() => setTime(option)}
                className={`block w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                  time === option
                    ? "border-primary bg-primary/5"
                    : "border-foreground/10 bg-white hover:border-foreground/20"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-foreground/20 px-6 py-2 text-sm hover:bg-foreground/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!time}
              className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            How can we reach you?
          </h2>
          <p className="text-sm text-foreground/60 mb-6">
            We use Signal for real-time chat, Google Docs for working drafts,
            and GitHub for code and specs. You don&apos;t need all of these —
            we&apos;ll work with whatever suits you.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Preferred contact method
              </label>
              <select
                value={contact.method}
                onChange={(e) =>
                  setContact((c) => ({ ...c, method: e.target.value }))
                }
                className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="email">Email (we already have it)</option>
                <option value="signal">Signal</option>
                <option value="other">Other</option>
              </select>
            </div>

            {contact.method === "signal" && (
              <input
                type="tel"
                placeholder="Phone number for Signal"
                value={contact.signal}
                onChange={(e) =>
                  setContact((c) => ({ ...c, signal: e.target.value }))
                }
                className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
              />
            )}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={contact.googleDocs}
                onChange={(e) =>
                  setContact((c) => ({
                    ...c,
                    googleDocs: e.target.checked,
                  }))
                }
                className="mt-1"
              />
              <span className="text-sm">
                Happy to be added to Google Docs for collaborative editing?
              </span>
            </label>

            {contact.googleDocs && (
              <input
                type="email"
                placeholder="Gmail / Google account email"
                value={contact.googleEmail}
                onChange={(e) =>
                  setContact((c) => ({ ...c, googleEmail: e.target.value }))
                }
                className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
              />
            )}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={contact.listedOnMembers}
                onChange={(e) =>
                  setContact((c) => ({
                    ...c,
                    listedOnMembers: e.target.checked,
                  }))
                }
                className="mt-1"
              />
              <span className="text-sm">
                Happy to be listed on the Members page?
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(3)}
              className="rounded-lg border border-foreground/20 px-6 py-2 text-sm hover:bg-foreground/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

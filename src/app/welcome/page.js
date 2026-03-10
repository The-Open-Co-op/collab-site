"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Strip OC query params for a clean URL
  useEffect(() => {
    if (searchParams.toString()) {
      router.replace("/welcome");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-4xl font-bold mb-1">Welcome to</h1>
        <h1 className="font-display text-4xl font-bold mb-4">
          The Open Co-op
        </h1>
        <p className="text-lg text-foreground/70 mb-6">
          Thank you for joining us.
        </p>
        <p className="text-foreground/60 mb-10">
          You can now sign in to the member dashboard to check out the latest
          progress, explore what we&apos;re building, and start contributing.
        </p>
        <a
          href="/login"
          className="inline-block rounded-full bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
        >
          Sign in to get started
        </a>
        <p className="mt-8 text-sm text-foreground/40">
          Use the same email you signed up with on Open Collective.
        </p>
      </div>
    </div>
  );
}

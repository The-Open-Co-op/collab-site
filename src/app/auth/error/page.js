"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl font-bold mb-4">
          Authentication Error
        </h1>
        <p className="text-foreground/60 mb-4">
          Something went wrong during sign in.
        </p>
        {error && (
          <p className="text-sm bg-white border border-foreground/10 rounded-lg p-4 font-mono">
            Error: {error}
          </p>
        )}
        <a
          href="/login"
          className="inline-block mt-6 text-primary hover:underline font-medium"
        >
          Try again
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}

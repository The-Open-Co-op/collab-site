"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs text-foreground/50 hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}

"use client";

export function SignOutButton() {
  async function handleSignOut() {
    document.cookie =
      "session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-foreground/50 hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}

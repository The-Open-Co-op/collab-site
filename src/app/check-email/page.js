export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Check your email</h1>
        <p className="text-foreground/60">
          We&apos;ve sent you a sign-in link. Click it to access the member home.
        </p>
        <p className="mt-4 text-sm text-foreground/40">
          If you don&apos;t see it, check your spam folder.
        </p>
      </div>
    </div>
  );
}

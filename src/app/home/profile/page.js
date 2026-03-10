import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

      <div className="space-y-6">
        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-foreground/50 mb-1">
                Email
              </label>
              <p className="text-sm">{session.user.email}</p>
            </div>

            <div>
              <label className="block text-xs text-foreground/50 mb-1">
                Membership
              </label>
              <p className="text-sm">
                {session.user.isMember ? (
                  <span className="text-primary font-medium">
                    Open Collective member
                  </span>
                ) : (
                  <span className="text-foreground/60">
                    Not yet an Open Collective member
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold mb-4">
            Skills &amp; preferences
          </h2>
          <p className="text-sm text-foreground/50">
            Complete the{" "}
            <a href="/home/get-started" className="text-primary hover:underline">
              Get Started
            </a>{" "}
            questionnaire to set your skills, interests, and contact
            preferences.
          </p>
        </div>

        <div className="flex gap-4">
          <a
            href="https://opencollective.com/open-coop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline font-medium"
          >
            Manage subscription on Open Collective →
          </a>
        </div>
      </div>
    </div>
  );
}

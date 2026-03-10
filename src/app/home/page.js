import { auth } from "@/auth";
import { getGoals, getRecentContributions } from "@/lib/opencollective";
import { getHelpWantedIssues, getRecentActivity } from "@/lib/github";

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const session = await auth();
  const [issues, goals, contributions, activity] = await Promise.all([
    getHelpWantedIssues(5).catch(() => []),
    getGoals().catch(() => []),
    getRecentContributions(3).catch(() => []),
    getRecentActivity(5).catch(() => []),
  ]);

  // Combine activity feeds
  const feed = [
    ...activity.map((a) => ({
      type: "code",
      text: a.description,
      date: a.date,
      url: a.url,
    })),
    ...contributions.map((c) => ({
      type: "contribution",
      text: `${c.from} contributed ${formatCurrency(c.amount, c.currency)}`,
      date: c.date,
      url: `https://opencollective.com/open-coop`,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">
        Welcome{session.user?.name ? `, ${session.user.name}` : ""}
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* What needs help */}
        <div className="rounded-xl border border-foreground/10 bg-white p-6 md:col-span-1">
          <h2 className="font-display text-lg font-bold mb-4">
            What needs help
          </h2>
          {issues.length > 0 ? (
            <ul className="space-y-3">
              {issues.map((issue) => (
                <li key={issue.url}>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:bg-foreground/5 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <span className="font-medium text-sm">{issue.title}</span>
                    {issue.body && (
                      <span className="block text-xs text-foreground/50 mt-0.5 line-clamp-1">
                        {issue.body}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/50">
              Check the{" "}
              <a href="/home/get-started" className="text-primary hover:underline">
                Get Started
              </a>{" "}
              page for ways to contribute.
            </p>
          )}
        </div>

        {/* What's being funded */}
        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold mb-4">
            What&apos;s being funded
          </h2>
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((goal.raised / goal.target) * 100)
                );
                return (
                  <div key={goal.slug || goal.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-foreground/50">
                        {formatCurrency(goal.raised, goal.currency)} /{" "}
                        {formatCurrency(goal.target, goal.currency)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-foreground/50">
              No active feature bounties right now.
            </p>
          )}
          <a
            href="https://opencollective.com/open-coop"
            className="inline-block mt-4 text-sm text-primary hover:underline font-medium"
          >
            Fund a feature &rarr;
          </a>
        </div>

        {/* What's new */}
        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold mb-4">
            What&apos;s new
          </h2>
          {feed.length > 0 ? (
            <ul className="space-y-3">
              {feed.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5">
                    {item.type === "code" ? "📝" : "💰"}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {item.text}
                  </a>
                  <span className="shrink-0 text-foreground/40 ml-auto">
                    {timeAgo(item.date)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/50">No recent activity.</p>
          )}
        </div>

        {/* Governance */}
        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold mb-4">Governance</h2>
          <p className="text-sm text-foreground/70 mb-4">
            Members can make proposals and vote on decisions via Loomio. This is
            where the co-op&apos;s direction gets decided.
          </p>
          <div className="flex gap-3">
            <a
              href="https://www.loomio.com/the-open-co-op"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-medium"
            >
              View proposals &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

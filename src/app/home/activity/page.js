import { getRecentActivity } from "@/lib/github";
import { getRecentContributions } from "@/lib/opencollective";

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

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

export default async function ActivityPage() {
  const [activity, contributions] = await Promise.all([
    getRecentActivity(20).catch(() => []),
    getRecentContributions(10).catch(() => []),
  ]);

  const feed = [
    ...activity.map((a) => ({
      type: "code",
      text: a.description,
      actor: a.actor,
      date: a.date,
      url: a.url,
    })),
    ...contributions.map((c) => ({
      type: "contribution",
      text: `${c.from} contributed ${formatCurrency(c.amount, c.currency)}`,
      actor: c.from,
      date: c.date,
      url: "https://opencollective.com/open-coop",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-8">
        What&apos;s Happening
      </h1>

      {feed.length > 0 ? (
        <ul className="space-y-4">
          {feed.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg border border-foreground/10 bg-white p-4"
            >
              <span className="shrink-0 mt-0.5 text-lg">
                {item.type === "code" ? "📝" : "💰"}
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary transition-colors"
                >
                  {item.text}
                </a>
                <p className="text-xs text-foreground/40 mt-1">
                  {item.actor} · {timeAgo(item.date)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground/50">No recent activity.</p>
      )}
    </div>
  );
}

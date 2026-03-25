import Link from "next/link";

const demos = [
  {
    slug: "planet-onboarding",
    title: "Onboarding",
    subtitle: "Invite to first connections",
    description:
      "See how a new member joins PLANET — from receiving an invite link through to setting up their identity, importing contacts, and building trust profiles.",
    screens: 10,
  },
  {
    slug: "planet-pnm",
    title: "Main PNM",
    subtitle: "Core app features",
    description:
      "Explore the main Personal Network Manager — chat reactions, group chats, the encrypted vault, app store, and alerts.",
    screens: 7,
  },
  {
    slug: "planet-introducer",
    title: "Introducer",
    subtitle: "A PLANET app",
    description:
      "The Introducer is an app that runs within PLANET. Follow an introduction from compose to completion — consent, group chat, bow out gracefully, mark as valuable, and see ripple effects.",
    screens: 7,
  },
];

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center py-16 px-6">
      <h1 className="font-display text-3xl font-bold mb-2">PLANET Demos</h1>
      <p className="text-foreground/50 mb-10 max-w-md text-center">
        Interactive walkthroughs of PLANET features. Each demo runs inside a
        simulated phone with UX and backend annotations.
      </p>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
        {demos.map((demo) => (
          <Link
            key={demo.slug}
            href={`/demo/${demo.slug}`}
            className="rounded-xl border border-foreground/10 bg-white p-6 hover:border-foreground/20 hover:shadow-lg transition-all group"
          >
            <h2 className="font-display text-xl font-bold mb-1 group-hover:text-primary transition-colors">
              {demo.title}
            </h2>
            <p className="text-sm text-foreground/50 mb-3">{demo.subtitle}</p>
            <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
              {demo.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/40">
                {demo.screens} screens
              </span>
              <span className="text-xs font-medium text-primary group-hover:underline">
                View Demo &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

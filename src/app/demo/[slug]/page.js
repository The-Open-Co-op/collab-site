import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import DemoClient from "@/components/demo-client";

const demos = {
  "planet-onboarding": {
    title: "PLANET App Store Onboarding Demo — OLD",
    url: "https://planet-sepia.vercel.app/#/demo/onboarding",
    firstStep: { slug: "invite", title: "Invite Received" },
  },
  "planet-pwa-onboarding": {
    title: "PLANET PWA Onboarding Demo",
    url: "https://planet-sepia.vercel.app/#/demo/pwa-onboarding",
    firstStep: { slug: "invite", title: "Invite Received" },
  },
  "planet-pnm": {
    title: "PLANET Main PNM Demo",
    url: "https://planet-sepia.vercel.app/#/demo/pnm",
    firstStep: { slug: "home", title: "Home" },
  },
  "planet-introducer": {
    title: "PLANET Introducer Demo",
    url: "https://planet-sepia.vercel.app/#/demo/introducer",
    firstStep: { slug: "dashboard", title: "Introducer Dashboard" },
  },
  "planet-invite-flow": {
    title: "PLANET Invite Flow Demo",
    url: "https://planet-sepia.vercel.app/#/demo/invite-flow",
    firstStep: { slug: "contacts", title: "Contacts" },
  },
  "planet-blog": {
    title: "PLANET Blog (FPP) Demo",
    url: "https://planet-sepia.vercel.app/#/demo/blog",
    firstStep: { slug: "install", title: "Install the blog app" },
  },
  "planet-feeds": {
    title: "PLANET Feeds Demo",
    url: "https://planet-sepia.vercel.app/#/demo/feeds",
    firstStep: { slug: "install", title: "Install Feeds" },
  },
};

export default async function DemoPage({ params }) {
  const { slug } = await params;
  const demo = demos[slug];

  if (!demo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50">Demo not found.</p>
      </div>
    );
  }

  const session = await auth();

  let isContributor = false;
  if (session?.user?.email) {
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("email", session.user.email)
      .limit(1)
      .single();
    isContributor = member?.role === "core team";
  }

  return (
    <DemoClient
      demoSlug={slug}
      demoTitle={demo.title}
      demoUrl={demo.url}
      firstStep={demo.firstStep}
      user={session?.user || null}
      isContributor={isContributor}
    />
  );
}

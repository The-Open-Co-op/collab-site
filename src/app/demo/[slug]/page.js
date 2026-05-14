import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import DemoClient from "@/components/demo-client";

const demos = {
  "planet-onboarding": {
    title: "PLANET App Store Onboarding Demo — OLD",
    url: "https://planet-sepia.vercel.app/#/demo/onboarding",
  },
  "planet-pwa-onboarding": {
    title: "PLANET PWA Onboarding Demo",
    url: "https://planet-sepia.vercel.app/#/demo/pwa-onboarding",
  },
  "planet-pnm": {
    title: "PLANET Main PNM Demo",
    url: "https://planet-sepia.vercel.app/#/demo/pnm",
  },
  "planet-introducer": {
    title: "PLANET Introducer Demo",
    url: "https://planet-sepia.vercel.app/#/demo/introducer",
  },
  "planet-invite-flow": {
    title: "PLANET Invite Flow Demo",
    url: "https://planet-sepia.vercel.app/#/demo/invite-flow",
  },
  "planet-blog": {
    title: "PLANET Blog (FPP) Demo",
    url: "https://planet-sepia.vercel.app/#/demo/blog",
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
      user={session?.user || null}
      isContributor={isContributor}
    />
  );
}

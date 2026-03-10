import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/home/get-started", label: "Get Started" },
  { href: "/home/activity", label: "What's Happening" },
  { href: "/home/showcase", label: "Showcase" },
  {
    href: "https://www.loomio.com/the-open-co-op",
    label: "Governance",
    external: true,
  },
  { href: "/home/members", label: "Members" },
  { href: "/home/profile", label: "My Profile" },
];

export default async function HomeLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-foreground/10 bg-white p-6 hidden md:block">
        <Link href="/" className="font-display text-xl font-bold block mb-8">
          PLANET
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              {...(item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
            >
              {item.label}
              {item.external && (
                <span className="ml-1 text-foreground/30">&#x2197;</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-foreground/10">
          <p className="text-xs text-foreground/50 mb-2 truncate">
            {session.user?.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}

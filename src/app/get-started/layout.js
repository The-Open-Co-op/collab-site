import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GetStartedLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  return <div className="min-h-screen">{children}</div>;
}

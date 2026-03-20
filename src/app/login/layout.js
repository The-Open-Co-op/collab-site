import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginLayout({ children }) {
  const session = await auth();
  if (session?.user) redirect("/home");
  return children;
}

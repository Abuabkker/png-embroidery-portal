import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any)?.role;
  if (role === "ADMIN" || role === "SUPER_ADMIN") redirect("/admin/dashboard");
  redirect("/dashboard");
}

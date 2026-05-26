import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomerLayout from "@/components/customer/CustomerLayout";

export default async function CustomerRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return <CustomerLayout>{children}</CustomerLayout>;
}

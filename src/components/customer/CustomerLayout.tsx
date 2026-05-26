"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, ShoppingBag, ClipboardList, Pencil, MapPin, Bell, LogOut, ShoppingCart, User, Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard" },
  { icon: ShoppingBag,     label: "Shop Now",      href: "/shop" },
  { icon: ClipboardList,   label: "My Orders",     href: "/orders" },
  { icon: Pencil,          label: "Custom Order",  href: "/custom-order" },
  { icon: MapPin,          label: "Addresses",     href: "/profile#addresses" },
  { icon: Bell,            label: "Notifications", href: "/notifications" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center">
              {session?.user?.image ? <img src={session.user.image} alt="" className="w-full h-full rounded-full object-cover" /> : <User size={26} className="text-white" />}
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-900">{session?.user?.name || "Customer"}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all",
                pathname === href || pathname.startsWith(href + "/") ? "bg-navy text-white font-bold" : "text-gray-600 hover:bg-gray-50")}>
              <Icon size={17} strokeWidth={pathname === href ? 2.2 : 1.8} />
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3">
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={17} strokeWidth={1.8} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">
              <ShoppingCart size={15} strokeWidth={1.8} />
              <span className="bg-navy text-white text-xs font-bold rounded-full px-1.5">0</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-900">{session?.user?.name?.split(" ")[0]}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}

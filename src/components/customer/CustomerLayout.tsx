"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, ShoppingBag, ClipboardList, BarChart2, Bell, LogOut, ShoppingCart, User, Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BASE_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag,     label: "Shop Now",  href: "/shop" },
  { icon: ClipboardList,   label: "My Orders", href: "/orders" },
  { icon: Bell,            label: "Notifications", href: "/notifications" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [cartCount, setCartCount]     = useState(0);
  const [notifCount, setNotifCount]   = useState(0);
  const isSuperior = (session?.user as any)?.role === "SUPERIOR_CUSTOMER";
  const NAV = isSuperior
    ? [...BASE_NAV, { icon: BarChart2, label: "Reports", href: "/reports" }]
    : BASE_NAV;

  const fetchCartCount = useCallback(async () => {
    try {
      const res  = await fetch("/api/cart");
      const data = await res.json();
      const items: any[] = data.data || [];
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
    } catch { /* ignore */ }
  }, []);

  const fetchNotifCount = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setNotifCount(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchCartCount();
    fetchNotifCount();
    window.addEventListener("cart-updated", fetchCartCount);
    window.addEventListener("notif-updated", fetchNotifCount);
    const interval = setInterval(fetchNotifCount, 30000);
    return () => {
      window.removeEventListener("cart-updated", fetchCartCount);
      window.removeEventListener("notif-updated", fetchNotifCount);
      clearInterval(interval);
    };
  }, [session, fetchCartCount, fetchNotifCount]);

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
              {isSuperior && (
                <span className="mt-1.5 inline-block text-[10px] font-bold bg-navy text-white rounded-full px-2 py-0.5 tracking-wide">
                  SUPERIOR
                </span>
              )}
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const showBadge = href === "/notifications" && notifCount > 0;
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all",
                  isActive ? "bg-navy text-white font-bold" : "text-gray-600 hover:bg-gray-50")}>
                <div className="relative">
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className={cn("text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center",
                    isActive ? "bg-white/20 text-white" : "bg-red-500 text-white")}>
                    {notifCount}
                  </span>
                )}
              </Link>
            );
          })}
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
            <Image src="/exxonmobil-logo.png" alt="ExxonMobil" width={120} height={36} className="object-contain" priority />
            <div className="hidden sm:block w-px h-7 bg-gray-200" />
            <Image src="/logo-new.webp" alt="PNG Embroidery" width={52} height={52} className="hidden sm:block object-contain" priority />
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link href="/notifications" className="relative p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={16} strokeWidth={1.8} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">
              <ShoppingCart size={15} strokeWidth={1.8} />
              <span className="bg-navy text-white text-xs font-bold rounded-full px-1.5 min-w-[1.25rem] text-center">
                {cartCount}
              </span>
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

"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, ClipboardList, Package, Pencil, Users, BarChart2, Tag, Settings, LogOut, Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/admin/dashboard" },
  { icon: ClipboardList,   label: "Orders",          href: "/admin/orders" },
  { icon: Package,         label: "Products",        href: "/admin/products" },
  { icon: Pencil,          label: "Custom Queue",    href: "/admin/queue",    badge: true },
  { icon: Users,           label: "Customers",       href: "/admin/customers" },
  { icon: BarChart2,       label: "Reports",         href: "/admin/reports" },
  { icon: Tag,             label: "Discounts",       href: "/admin/discounts" },
  { icon: Settings,        label: "Settings",        href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-[235px] bg-navy flex flex-col transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-left">
            <div className="text-2xl font-extrabold text-white tracking-tight leading-none">PNG</div>
            <div className="text-base font-serif italic text-yellow-300 leading-none mt-0.5">Embroidery</div>
          </div>
          <div className="text-[10px] font-bold tracking-widest text-white/40 mt-2 uppercase">Admin Portal</div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, href, badge }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all",
                pathname === href || pathname.startsWith(href + "/") ? "bg-white/16 text-white font-bold" : "text-white/60 hover:text-white hover:bg-white/8 font-medium")}>
              <Icon size={16} strokeWidth={pathname === href ? 2.2 : 1.7} />
              <span className="flex-1">{label}</span>
              {badge && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">4</span>}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-4 pt-3">
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/55 hover:text-white/80 transition-colors">
              <LogOut size={16} strokeWidth={1.7} /> Sign Out
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><User size={16} className="text-white" /></div>
            <div>
              <p className="text-xs font-semibold text-white">{session?.user?.name || "Admin"}</p>
              <p className="text-[10px] text-white/50">{(session?.user as any)?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[235px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="font-bold text-gray-900 text-base">
              {NAV.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "Admin"}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Truck, Pencil, UserCircle, Plus, AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const [orders, totalSpent, pendingProof] = await Promise.all([
    prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.order.aggregate({ where: { userId, paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.order.count({ where: { userId, status: "PROOF_SENT" } }),
  ]);

  const active = orders.filter(o => !["DELIVERED","CANCELLED"].includes(o.status)).length;
  const completed = await prisma.order.count({ where: { userId, status: "DELIVERED" } });

  const firstName = session.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your orders.</p>
        </div>
        <Link href="/shop" className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
          <Plus size={15} strokeWidth={2.5} /> New Order
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Orders", value: active, sub: "In progress", color: "border-brand-red" },
          { label: "Completed Orders", value: completed, sub: "All time", color: "border-brand-red" },
          { label: "Awaiting Proof", value: pendingProof, sub: pendingProof > 0 ? "Action needed" : "All clear", color: pendingProof > 0 ? "border-amber-400" : "border-brand-red" },
          { label: "Total Spent", value: formatCurrency(Number(totalSpent._sum.total || 0)), sub: "Lifetime value", color: "border-brand-red" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl p-5 border-t-[3px] ${s.color}`}>
            <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{s.value}</div>
            <div className="text-sm text-gray-600 font-medium mb-1.5">{s.label}</div>
            <div className="text-xs text-green-600 font-semibold flex items-center gap-1"><ArrowUpRight size={12} strokeWidth={2.5} />{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-navy text-base">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-navy font-semibold flex items-center gap-1 hover:underline">View All <ArrowUpRight size={14} /></Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders yet</p>
              <Link href="/shop" className="text-navy text-sm font-semibold mt-2 inline-block hover:underline">Start shopping →</Link>
            </div>
          ) : orders.map(o => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {o.items[0]?.productImage ? <img src={o.items[0].productImage} alt="" className="w-full h-full object-contain rounded-xl p-1" /> : <ShoppingBag size={18} className="text-navy" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{o.items[0]?.productName}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}</p>
                <p className="text-xs text-gray-400">#{o.orderNumber}</p>
              </div>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {pendingProof > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex gap-3 mb-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-gray-900 mb-1">Proof Approval Needed</p>
                  <p className="text-xs text-gray-600">You have {pendingProof} order(s) awaiting your design approval.</p>
                </div>
              </div>
              <Link href="/orders?status=PROOF_SENT" className="flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold rounded-xl py-2.5 hover:bg-green-700 transition-colors">
                <CheckCircle size={15} /> Review Proof
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-extrabold text-sm text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[["Shop Products", ShoppingBag, "/shop"], ["Track Orders", Truck, "/orders"], ["Custom Order", Pencil, "/custom-order"], ["Edit Profile", UserCircle, "/profile"]].map(([label, Icon, href]: any) => (
                <Link key={href} href={href} className="bg-gray-50 border border-gray-200 rounded-xl py-3 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                  <Icon size={14} strokeWidth={1.8} />{label}
                </Link>
              ))}
            </div>
          </div>

          {/* Monthly progress */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-extrabold text-sm text-gray-900 mb-3">Order Progress This Month</h3>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Completed</span><span className="font-bold text-gray-900">{completed} / {orders.length + completed} orders</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2">
              <div className="bg-navy rounded-full h-2 transition-all" style={{ width: `${(completed / Math.max(orders.length + completed, 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

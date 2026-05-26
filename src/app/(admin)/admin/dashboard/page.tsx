import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Package, DollarSign, Clock, Users, TrendingUp, AlertTriangle, ChevronRight, PieChart } from "lucide-react";

export default async function AdminDashboardPage() {
  const now = new Date();
  const today = new Date(now.setHours(0,0,0,0));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayOrders, monthRevenue, pendingQueue, newCustomers, recentOrders, byStatus, lowStock] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.customizationReview.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),
    prisma.order.findMany({ include: { user: { select: { name: true } }, items: true }, orderBy: { createdAt: "desc" }, take: 7 }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.product.findMany({ where: { isActive: true, stockQty: { lte: 10 } }, orderBy: { stockQty: "asc" }, take: 5 }),
  ]);

  const kpis = [
    { label: "Orders Today",     value: todayOrders.toString(),                           icon: Package,    bg: "bg-indigo-50", ic: "text-navy" },
    { label: "Revenue (Month)",  value: formatCurrency(Number(monthRevenue._sum.total||0)), icon: DollarSign, bg: "bg-green-50",  ic: "text-green-600" },
    { label: "Pending Review",   value: pendingQueue.toString(),                          icon: Clock,      bg: "bg-amber-50",  ic: "text-amber-600" },
    { label: "New Customers",    value: newCustomers.toString(),                          icon: Users,      bg: "bg-red-50",    ic: "text-red-500" },
  ];

  const statusColors: Record<string, string> = {
    ORDER_RECEIVED:"bg-gray-200", IN_REVIEW:"bg-purple-400", PROOF_SENT:"bg-orange-400",
    IN_PRODUCTION:"bg-blue-500", QUALITY_CHECK:"bg-indigo-500", SHIPPED:"bg-green-500", DELIVERED:"bg-emerald-600", CANCELLED:"bg-red-400",
  };
  const totalByStatus = byStatus.reduce((s, b) => s + b._count.id, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-PG", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} · Port Moresby</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm text-gray-500 font-medium">{k.label}</span>
              <div className={`${k.bg} rounded-xl p-1.5`}><k.icon size={18} className={k.ic} strokeWidth={1.8} /></div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">{k.value}</div>
            <div className="text-xs text-green-600 font-semibold flex items-center gap-1"><TrendingUp size={12} strokeWidth={2.5} />vs last period</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-extrabold text-base text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-navy font-semibold flex items-center gap-1 hover:underline">View All <ChevronRight size={14} /></Link>
          </div>
          <div className="hidden md:grid grid-cols-[90px_1fr_1fr_100px_160px] px-5 py-2.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Order</span><span>Customer</span><span>Product</span><span>Amount</span><span>Status</span>
          </div>
          {recentOrders.map(o => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="grid grid-cols-1 md:grid-cols-[90px_1fr_1fr_100px_160px] px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-sm items-center gap-1">
              <span className="font-bold text-navy text-xs">#{o.orderNumber.split("-").slice(1).join("-")}</span>
              <span className="font-semibold text-gray-900">{o.user?.name || "—"}</span>
              <span className="text-gray-600 text-xs truncate">{o.items?.[0]?.productName || "—"}{o.items?.length > 1 ? ` +${o.items.length-1}` : ""}</span>
              <span className="font-bold">{formatCurrency(Number(o.total))}</span>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {pendingQueue > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-amber-500" /><span className="font-bold text-sm">Customization Queue</span></div>
              <p className="text-sm text-gray-600 mb-3">{pendingQueue} orders awaiting design review</p>
              <Link href="/admin/queue" className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-bold rounded-xl py-2.5 hover:bg-amber-600 transition-colors">Review Queue <ChevronRight size={14} /></Link>
            </div>
          )}

          {/* Low Stock */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={15} className="text-red-500" /><span className="font-bold text-sm">Low Stock Alerts</span></div>
            {lowStock.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-700 truncate">{p.name}</span>
                <span className={`font-bold ml-2 ${p.stockQty < 5 ? "text-red-500" : "text-amber-500"}`}>{p.stockQty} left</span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-gray-400 text-center py-4">All products well stocked ✓</p>}
          </div>

          {/* By Status */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3"><PieChart size={15} className="text-navy" /><span className="font-bold text-sm">Orders by Status</span></div>
            {byStatus.sort((a,b) => b._count.id - a._count.id).map(s => (
              <div key={s.status} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{s.status.replace(/_/g," ")}</span><span className="font-bold">{s._count.id}</span></div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div className={`${statusColors[s.status] || "bg-gray-400"} rounded-full h-1.5`} style={{ width: `${(s._count.id / totalByStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

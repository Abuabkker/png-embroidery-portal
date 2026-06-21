import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const r = (s.user as any).role;
  return (r === "ADMIN" || r === "SUPER_ADMIN") ? s : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly";

  const now = new Date();
  const startOf = (offset: number, unit: "day" | "week" | "month" | "year") => {
    const d = new Date(now);
    if (unit === "day")   { d.setDate(d.getDate() - offset); d.setHours(0,0,0,0); }
    if (unit === "week")  { d.setDate(d.getDate() - offset * 7); d.setHours(0,0,0,0); }
    if (unit === "month") { d.setMonth(d.getMonth() - offset); d.setDate(1); d.setHours(0,0,0,0); }
    if (unit === "year")  { d.setFullYear(d.getFullYear() - offset); d.setMonth(0); d.setDate(1); d.setHours(0,0,0,0); }
    return d;
  };

  const todayStart   = startOf(0, "day");
  const weekStart    = startOf(0, "week");
  const monthStart   = startOf(0, "month");
  const yearStart    = startOf(0, "year");

  const allOrders = await prisma.order.findMany({
    include: { items: true, user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  // ── Revenue time-series ──
  const buckets: { label: string; revenue: number; orders: number }[] = [];
  if (period === "daily") {
    for (let i = 29; i >= 0; i--) {
      const from = startOf(i, "day"); const to = startOf(i - 1, "day");
      const slice = allOrders.filter(o => o.createdAt >= from && o.createdAt < to && o.status !== "CANCELLED");
      buckets.push({ label: from.toLocaleDateString("en-US",{month:"short",day:"numeric"}), revenue: slice.reduce((s,o)=>s+Number(o.total),0), orders: slice.length });
    }
  } else if (period === "weekly") {
    for (let i = 11; i >= 0; i--) {
      const from = startOf(i, "week"); const to = startOf(i - 1, "week");
      const slice = allOrders.filter(o => o.createdAt >= from && o.createdAt < to && o.status !== "CANCELLED");
      buckets.push({ label: `W${12-i}: ${from.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`, revenue: slice.reduce((s,o)=>s+Number(o.total),0), orders: slice.length });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const from = startOf(i, "month"); const to = startOf(i - 1, "month");
      const slice = allOrders.filter(o => o.createdAt >= from && o.createdAt < to && o.status !== "CANCELLED");
      buckets.push({ label: from.toLocaleDateString("en-US",{month:"short",year:"2-digit"}), revenue: slice.reduce((s,o)=>s+Number(o.total),0), orders: slice.length });
    }
  }

  // ── KPIs ──
  const activeOrders   = allOrders.filter(o => o.status !== "CANCELLED");
  const totalRevenue   = activeOrders.reduce((s,o) => s+Number(o.total), 0);
  const dailyRevenue   = activeOrders.filter(o => o.createdAt >= todayStart).reduce((s,o)=>s+Number(o.total),0);
  const weeklyRevenue  = activeOrders.filter(o => o.createdAt >= weekStart).reduce((s,o)=>s+Number(o.total),0);
  const monthlyRevenue = activeOrders.filter(o => o.createdAt >= monthStart).reduce((s,o)=>s+Number(o.total),0);
  const yearlyRevenue  = activeOrders.filter(o => o.createdAt >= yearStart).reduce((s,o)=>s+Number(o.total),0);
  const avgOrderValue  = activeOrders.length ? totalRevenue / activeOrders.length : 0;

  const [totalCustomers, totalSuperior, newCustomersThisMonth] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "SUPERIOR_CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),
  ]);

  // ── Product report ──
  const productMap: Record<string, { name: string; image: string | null; qty: number; revenue: number }> = {};
  for (const order of activeOrders) {
    for (const item of order.items) {
      if (!productMap[item.productName]) productMap[item.productName] = { name: item.productName, image: item.productImage, qty: 0, revenue: 0 };
      productMap[item.productName].qty     += item.quantity;
      productMap[item.productName].revenue += Number(item.lineTotal);
    }
  }
  const topProducts = Object.values(productMap).sort((a,b) => b.revenue - a.revenue).slice(0, 10);

  // ── Customer report ──
  const customerMap: Record<string, { name: string; email: string; role: string; orders: number; revenue: number; lastOrder: Date }> = {};
  for (const order of activeOrders) {
    const key = order.user.id;
    if (!customerMap[key]) customerMap[key] = { name: order.user.name ?? "Unknown", email: order.user.email, role: order.user.role, orders: 0, revenue: 0, lastOrder: order.createdAt };
    customerMap[key].orders++;
    customerMap[key].revenue += Number(order.total);
    if (order.createdAt > customerMap[key].lastOrder) customerMap[key].lastOrder = order.createdAt;
  }
  const allCustomerReport = Object.values(customerMap).sort((a,b) => b.revenue - a.revenue);

  // ── Status breakdown ──
  const statusMap: Record<string, number> = {};
  for (const o of allOrders) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  const statusReport = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // ── Recent orders ──
  const recentOrders = [...allOrders].reverse().slice(0, 20).map(o => ({
    id: o.id, orderNumber: o.orderNumber,
    customer: { name: o.user.name, email: o.user.email, role: o.user.role },
    total: Number(o.total), status: o.status, paymentStatus: o.paymentStatus,
    itemCount: o.items.length, createdAt: o.createdAt,
  }));

  return NextResponse.json({
    // Legacy fields (keeps old admin page working)
    data: {
      totalOrders: allOrders.length, monthOrders: allOrders.filter(o => o.createdAt >= monthStart).length,
      totalRevenue, totalCustomers,
      topProducts: topProducts.map(p => ({ productName: p.name, productImage: p.image, _sum: { quantity: p.qty } })),
      byStatus: statusReport.map(s => ({ status: s.status, _count: { id: s.count } })),
    },
    // Rich fields for new admin reports page
    kpis: { totalRevenue, dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, totalOrders: allOrders.length, activeOrders: activeOrders.length, avgOrderValue, totalCustomers, totalSuperior, newCustomersThisMonth },
    timeSeries: buckets,
    topProducts,
    customerReport: allCustomerReport.filter(r => r.role === "CUSTOMER"),
    superiorReport: allCustomerReport.filter(r => r.role === "SUPERIOR_CUSTOMER"),
    statusReport,
    recentOrders,
  });
}

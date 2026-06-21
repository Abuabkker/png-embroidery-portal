import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const isSuperior = role === "SUPERIOR_CUSTOMER" || role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isSuperior) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly";

  const now = new Date();
  const startOf = (offset: number, unit: "day" | "week" | "month") => {
    const d = new Date(now);
    if (unit === "day")   { d.setDate(d.getDate() - offset); d.setHours(0,0,0,0); }
    if (unit === "week")  { d.setDate(d.getDate() - offset * 7); d.setHours(0,0,0,0); }
    if (unit === "month") { d.setMonth(d.getMonth() - offset); d.setDate(1); d.setHours(0,0,0,0); }
    return d;
  };

  // Only fetch CUSTOMER role orders (team members — not admins or superiors)
  const teamOrders = await prisma.order.findMany({
    where: { user: { role: "CUSTOMER" } },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // ── Time-series purchase buckets ──
  const buckets: { label: string; totalSpent: number; orders: number }[] = [];

  if (period === "daily") {
    for (let i = 29; i >= 0; i--) {
      const from = startOf(i, "day");
      const to   = startOf(i - 1, "day");
      const slice = teamOrders.filter(o => o.createdAt >= from && o.createdAt < to);
      buckets.push({
        label:      from.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        totalSpent: slice.reduce((s, o) => s + Number(o.total), 0),
        orders:     slice.length,
      });
    }
  } else if (period === "weekly") {
    for (let i = 11; i >= 0; i--) {
      const from = startOf(i, "week");
      const to   = startOf(i - 1, "week");
      const slice = teamOrders.filter(o => o.createdAt >= from && o.createdAt < to);
      buckets.push({
        label:      `W${12 - i}: ${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        totalSpent: slice.reduce((s, o) => s + Number(o.total), 0),
        orders:     slice.length,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const from = startOf(i, "month");
      const to   = startOf(i - 1, "month");
      const slice = teamOrders.filter(o => o.createdAt >= from && o.createdAt < to);
      buckets.push({
        label:      from.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        totalSpent: slice.reduce((s, o) => s + Number(o.total), 0),
        orders:     slice.length,
      });
    }
  }

  // ── Product-wise purchase breakdown ──
  const productMap: Record<string, { name: string; image: string | null; qty: number; totalSpent: number }> = {};
  for (const order of teamOrders) {
    for (const item of order.items) {
      const key = item.productName;
      if (!productMap[key]) productMap[key] = { name: item.productName, image: item.productImage, qty: 0, totalSpent: 0 };
      productMap[key].qty       += item.quantity;
      productMap[key].totalSpent += Number(item.lineTotal);
    }
  }
  const productReport = Object.values(productMap).sort((a, b) => b.totalSpent - a.totalSpent);

  // ── Team member breakdown ──
  const memberMap: Record<string, { name: string; email: string; orders: number; totalSpent: number; lastOrder: Date; products: string[] }> = {};
  for (const order of teamOrders) {
    const key = order.user.id;
    if (!memberMap[key]) memberMap[key] = {
      name: order.user.name ?? "Unknown",
      email: order.user.email,
      orders: 0,
      totalSpent: 0,
      lastOrder: order.createdAt,
      products: [],
    };
    memberMap[key].orders++;
    memberMap[key].totalSpent += Number(order.total);
    if (order.createdAt > memberMap[key].lastOrder) memberMap[key].lastOrder = order.createdAt;
    for (const item of order.items) {
      const label = `${item.productName} ×${item.quantity}`;
      if (!memberMap[key].products.includes(label)) memberMap[key].products.push(label);
    }
  }
  const teamReport = Object.values(memberMap).sort((a, b) => b.totalSpent - a.totalSpent);

  // ── Team activity feed (individual line items) ──
  const teamActivity = teamOrders
    .flatMap(o => o.items.map(item => ({
      memberName:   o.user.name ?? "Unknown",
      memberEmail:  o.user.email,
      productName:  item.productName,
      productImage: item.productImage,
      quantity:     item.quantity,
      spent:        Number(item.lineTotal),
      orderNumber:  o.orderNumber,
      orderId:      o.id,
      date:         o.createdAt,
      customization: item.customization,
    })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 100);

  // ── Order status breakdown ──
  const statusMap: Record<string, number> = {};
  for (const o of teamOrders) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  const statusReport = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // ── KPIs ──
  const totalSpent    = teamOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders   = teamOrders.length;
  const avgPurchase   = totalOrders ? totalSpent / totalOrders : 0;
  const teamMembers   = Object.keys(memberMap).length;

  // Period-specific totals
  const todayStart = startOf(0, "day");
  const weekStart  = startOf(0, "week");
  const monthStart = startOf(0, "month");
  const dailySpent   = teamOrders.filter(o => o.createdAt >= todayStart).reduce((s,o) => s + Number(o.total), 0);
  const weeklySpent  = teamOrders.filter(o => o.createdAt >= weekStart).reduce((s,o) => s + Number(o.total), 0);
  const monthlySpent = teamOrders.filter(o => o.createdAt >= monthStart).reduce((s,o) => s + Number(o.total), 0);

  return NextResponse.json({
    kpis: { totalSpent, totalOrders, avgPurchase, teamMembers, dailySpent, weeklySpent, monthlySpent },
    timeSeries: buckets,
    productReport,
    teamReport,
    teamActivity,
    statusReport,
  });
}

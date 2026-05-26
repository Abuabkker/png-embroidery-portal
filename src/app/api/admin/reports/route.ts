import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() { const s = await auth(); if(!s?.user) return null; const r=(s.user as any).role; return (r==="ADMIN"||r==="SUPER_ADMIN")?s:null; }
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [totalOrders, monthOrders, revenue, customers, topProducts, byStatus] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.orderItem.groupBy({ by: ["productName","productImage"], _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
  ]);
  return NextResponse.json({ data: { totalOrders, monthOrders, totalRevenue: revenue._sum.total || 0, totalCustomers: customers, topProducts, byStatus } });
}

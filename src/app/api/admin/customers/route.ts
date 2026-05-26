import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() { const s = await auth(); if(!s?.user) return null; const r=(s.user as any).role; return (r==="ADMIN"||r==="SUPER_ADMIN")?s:null; }
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: customers });
}

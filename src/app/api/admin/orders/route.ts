import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const role = (s.user as any).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") return null;
  return s;
}
export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (search) where.OR = [{ orderNumber: { contains: search, mode: "insensitive" } }, { user: { name: { contains: search, mode: "insensitive" } } }];
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { user: { select: { name: true, email: true } }, items: true, address: true }, orderBy: { createdAt: "desc" }, skip: (page-1)*limit, take: limit }),
    prisma.order.count({ where }),
  ]);
  return NextResponse.json({ data: orders, total, page, pages: Math.ceil(total / limit) });
}

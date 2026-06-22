import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const role = (s.user as any).role;
  return role === "ADMIN" || role === "SUPER_ADMIN" ? s : null;
}

export async function GET(req: NextRequest) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status  = searchParams.get("status");
    const search  = searchParams.get("search");
    const from    = searchParams.get("from");
    const to      = searchParams.get("to");
    const page    = parseInt(searchParams.get("page") || "1");
    const limit   = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name:  { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const [orders, total, pending] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:  { select: { name: true, email: true, role: true } },
          items: { select: { productName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.count({ where: { status: "PENDING_CONFIRMATION" } }),
    ]);

    return NextResponse.json({
      data:   orders,
      total,
      page,
      pages:  Math.ceil(total / limit),
      counts: { PENDING_CONFIRMATION: pending },
    });
  } catch (err) {
    console.error("[admin/orders] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const role   = (session.user as any).role;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, address: true, statusHistory: { orderBy: { createdAt: "desc" } }, customizationReview: true, user: { select: { name: true, email: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPrivileged = ["ADMIN","SUPER_ADMIN","SUPERIOR_CUSTOMER"].includes(role);
  if (order.userId !== userId && !isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ data: order });
}

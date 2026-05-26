import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const role = (s.user as any).role;
  return (role === "ADMIN" || role === "SUPER_ADMIN") ? s : null;
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { status, adminNotes, trackingNumber } = await req.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status, adminNotes, trackingNumber, ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}) },
  });
  await prisma.orderStatusHistory.create({ data: { orderId: params.id, status, note: adminNotes, changedBy: (session.user as any).id } });
  await prisma.notification.create({ data: { userId: order.userId, orderId: order.id, type: "order_update", title: "Order Updated", message: `Your order ${order.orderNumber} status changed to ${status.replace(/_/g, " ")}.` } });
  return NextResponse.json({ data: order });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    include: { order: { select: { orderNumber: true, total: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

  return NextResponse.json({ data: notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { id, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return NextResponse.json({ message: "All marked read" });
  }

  if (id) {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ message: "Marked read" });
  }

  return NextResponse.json({ error: "No action" }, { status: 400 });
}

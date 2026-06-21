import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [totalOrders, orderAgg] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.aggregate({ where: { userId, status: { not: "CANCELLED" } }, _sum: { total: true } }),
  ]);

  return NextResponse.json({ data: { ...user, totalOrders, totalSpent: Number(orderAgg._sum.total ?? 0) } });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { name, phone, currentPassword, newPassword } = await req.json();

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user?.password) return NextResponse.json({ error: "Password change not available for this account" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword ?? "", user.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return NextResponse.json({ message: "Password updated" });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(name !== undefined && { name: name.trim() }), ...(phone !== undefined && { phone: phone.trim() || null }) },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return NextResponse.json({ data: updated });
}

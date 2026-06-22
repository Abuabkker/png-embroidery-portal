import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const r = (s.user as any).role;
  return r === "ADMIN" || r === "SUPER_ADMIN" ? s : null;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, createdAt: true,
        orders: { select: { id: true, orderNumber: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { orders: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const { name, email, phone, role, isActive, newPassword } = await req.json();

    const data: any = {};
    if (name        !== undefined) data.name     = name;
    if (email       !== undefined) data.email    = email;
    if (phone       !== undefined) data.phone    = phone;
    if (role        !== undefined) data.role     = role;
    if (isActive    !== undefined) data.isActive = isActive;
    if (newPassword)               data.password = await bcrypt.hash(newPassword, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    return NextResponse.json({ data: user });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

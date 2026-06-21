import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { productId, quantity = 1, customization } = await req.json();

  // Find all cart items for this user+product and match by customization
  const existingItems = await prisma.cartItem.findMany({ where: { userId, productId } });
  const customizationKey = JSON.stringify(customization ?? null);
  const matching = existingItems.find(i => JSON.stringify(i.customization) === customizationKey);

  if (matching) {
    const updated = await prisma.cartItem.update({
      where: { id: matching.id },
      data: { quantity: matching.quantity + quantity },
      include: { product: { include: { category: true } } },
    });
    return NextResponse.json({ data: updated });
  }

  const item = await prisma.cartItem.create({
    data: { userId, productId, quantity, customization },
    include: { product: { include: { category: true } } },
  });
  return NextResponse.json({ data: item }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId, quantity } = await req.json();
  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: "Removed" });
  }
  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { product: { include: { category: true } } },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await req.json();
  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ message: "Removed" });
}

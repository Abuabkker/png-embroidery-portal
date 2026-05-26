import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      address: true,
      customizationReview: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: orders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { addressId, shippingMethod, discountCode, paymentMethod = "bank_transfer" } = await req.json();

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  if (cartItems.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  let discount = 0;
  if (discountCode) {
    const dc = await prisma.discountCode.findUnique({ where: { code: discountCode, isActive: true } });
    if (dc) {
      const sub = cartItems.reduce((s, i) => s + Number(i.product.basePrice) * i.quantity, 0);
      discount = dc.type === "PERCENTAGE" ? (sub * Number(dc.value)) / 100 : Number(dc.value);
      await prisma.discountCode.update({ where: { id: dc.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  const subtotal = cartItems.reduce((s, i) => s + Number(i.product.basePrice) * i.quantity, 0);
  const customTotal = cartItems.reduce((s, i) => i.customization ? s + Number(i.product.customSurcharge) * i.quantity : s, 0);
  const shippingCost = shippingMethod === "express" ? 60 : 25;
  const total = subtotal + customTotal + shippingCost - discount;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      addressId,
      status: "ORDER_RECEIVED",
      paymentStatus: "PENDING",
      paymentMethod,
      subtotal,
      customTotal,
      shippingCost,
      discount,
      total,
      discountCode,
      shippingMethod,
      items: {
        create: cartItems.map((i) => ({
          productId: i.productId,
          productName: i.product.name,
          productImage: i.product.imageUrl,
          quantity: i.quantity,
          unitPrice: i.product.basePrice,
          customSurcharge: i.customization ? i.product.customSurcharge : 0,
          customization: i.customization,
          lineTotal: (Number(i.product.basePrice) + (i.customization ? Number(i.product.customSurcharge) : 0)) * i.quantity,
        })),
      },
      statusHistory: { create: { status: "ORDER_RECEIVED", note: "Order placed by customer" } },
    },
    include: { items: true },
  });

  // Create customization review if any items have customization
  const hasCustom = cartItems.some((i) => i.customization);
  if (hasCustom) {
    await prisma.customizationReview.create({
      data: { orderId: order.id, status: "PENDING", instructions: "See individual item customization details." },
    });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { userId } });

  // Notification
  await prisma.notification.create({
    data: { userId, orderId: order.id, type: "order_placed", title: "Order Placed!", message: `Your order ${order.orderNumber} has been received.` },
  });

  return NextResponse.json({ data: order }, { status: 201 });
}

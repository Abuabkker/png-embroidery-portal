import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, formatCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true, address: true, customizationReview: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: orders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = session.user.name ?? "Customer";

  const { shippingMethod, discountCode, paymentMethod = "bank_transfer" } = await req.json();

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

  const subtotal    = cartItems.reduce((s, i) => s + Number(i.product.basePrice) * i.quantity, 0);
  const customTotal = cartItems.reduce((s, i) => i.customization ? s + Number(i.product.customSurcharge) * i.quantity : s, 0);
  const shippingCost = shippingMethod === "express" ? 60 : 25;
  const total = subtotal + customTotal + shippingCost - discount;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: "CONFIRMED",
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
        create: cartItems.map(i => ({
          productId:      i.productId,
          productName:    i.product.name,
          productImage:   i.product.imageUrl ?? null,
          quantity:       i.quantity,
          unitPrice:      i.product.basePrice,
          customSurcharge: i.customization ? i.product.customSurcharge : 0,
          customization:  i.customization ?? undefined,
          lineTotal:      (Number(i.product.basePrice) + (i.customization ? Number(i.product.customSurcharge) : 0)) * i.quantity,
        })) as any,
      },
      statusHistory: { create: { status: "CONFIRMED", note: "Order confirmed by customer" } },
    },
    include: { items: true },
  });

  if (cartItems.some(i => i.customization)) {
    await prisma.customizationReview.create({
      data: { orderId: order.id, status: "PENDING", instructions: "See individual item customization details." },
    });
  }

  await prisma.cartItem.deleteMany({ where: { userId } });

  // ── Broadcast notifications ──
  const dateStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const customerNotif = prisma.notification.create({
    data: {
      userId,
      orderId: order.id,
      type:    "order_confirmed",
      title:   `Order #${order.orderNumber} Confirmed`,
      message: `Your order has been placed successfully on ${dateStr}. Total: ${formatCurrency(Number(total))}. We'll notify you as it progresses.`,
    },
  });

  // Notify all SUPERIOR_CUSTOMERs and admins
  const privilegedUsers = await prisma.user.findMany({
    where: { role: { in: ["SUPERIOR_CUSTOMER", "ADMIN", "SUPER_ADMIN"] }, id: { not: userId } },
    select: { id: true },
  });

  const privilegedNotifs = privilegedUsers.map(u =>
    prisma.notification.create({
      data: {
        userId:  u.id,
        orderId: order.id,
        type:    "order_placed",
        title:   `${userName} placed Order #${order.orderNumber}`,
        message: `${userName} confirmed a new order on ${dateStr}. Total: ${formatCurrency(Number(total))}. ${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} · ${shippingMethod} shipping.`,
      },
    })
  );

  await Promise.all([customerNotif, ...privilegedNotifs]);

  return NextResponse.json({ data: order }, { status: 201 });
}

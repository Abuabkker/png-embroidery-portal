import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const role = (s.user as any).role;
  return role === "ADMIN" || role === "SUPER_ADMIN" ? s : null;
}

// ── GET: full order detail ────────────────────────────────────────────────────
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await checkAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        address: true,
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          include: { changedByUser: { select: { name: true, role: true } } },
        },
        customizationReview: true,
        notification: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: order });
  } catch (err) {
    console.error("[admin/orders/id] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH: update status / notes / tracking ───────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await checkAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const adminId = (session.user as any).id;

    const body = await req.json();
    const {
      status, adminNotes, trackingNumber, estimatedDelivery, notes,
      // payment fields
      paymentStatus, paymentMethod, paymentReceivedDate, bankDepositRef, amountReceived, paymentNotes,
    } = body;

    const updateData: any = {};
    if (status              !== undefined) updateData.status              = status;
    if (adminNotes          !== undefined) updateData.adminNotes           = adminNotes;
    if (trackingNumber      !== undefined) updateData.trackingNumber       = trackingNumber;
    if (estimatedDelivery   !== undefined) updateData.estimatedDelivery    = estimatedDelivery ? new Date(estimatedDelivery) : null;
    if (notes               !== undefined) updateData.notes                = notes;
    if (status === "DELIVERED")            updateData.deliveredAt          = new Date();
    // payment fields
    if (paymentStatus       !== undefined) updateData.paymentStatus        = paymentStatus;
    if (paymentMethod       !== undefined) updateData.paymentMethod        = paymentMethod;
    if (paymentReceivedDate !== undefined) updateData.paymentReceivedDate  = paymentReceivedDate ? new Date(paymentReceivedDate) : null;
    if (bankDepositRef      !== undefined) updateData.bankDepositRef       = bankDepositRef;
    if (amountReceived      !== undefined) updateData.amountReceived       = amountReceived ? parseFloat(amountReceived) : null;
    if (paymentNotes        !== undefined) updateData.paymentNotes         = paymentNotes;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, name: true } } },
    });

    // Record status history only when order status changes
    if (status) {
      await prisma.orderStatusHistory.create({
        data: { orderId: id, status, note: adminNotes || null, changedBy: adminId },
      });
    }

    // ── Notifications ──────────────────────────────────────────────────────────
    const notifPromises: Promise<any>[] = [];

    const superiors = await prisma.user.findMany({
      where: { role: "SUPERIOR_CUSTOMER" },
      select: { id: true },
    });

    // Order status notification
    if (status) {
      const label = status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const message =
        status === "CONFIRMED"
          ? `Your Order #${order.orderNumber} has been confirmed by our team. We'll keep you updated as it progresses.`
          : status === "CANCELLED"
          ? `Order #${order.orderNumber} has been cancelled by the Administrator.`
          : `Your Order #${order.orderNumber} has been moved to ${label}.`;

      // Notify the customer
      notifPromises.push(prisma.notification.create({
        data: {
          userId:  order.userId,
          orderId: order.id,
          type:    "order_update",
          title:   status === "CANCELLED" ? `Order #${order.orderNumber} Cancelled` : `Order #${order.orderNumber} — ${label}`,
          message,
        },
      }));

      // Notify all SUPERIOR_CUSTOMERs
      superiors.forEach(u => notifPromises.push(
        prisma.notification.create({
          data: {
            userId:  u.id,
            orderId: order.id,
            type:    "order_update",
            title:   `Order #${order.orderNumber} — ${label}`,
            message: `${order.user?.name ?? "A customer"}'s order has been updated to ${label}.`,
          },
        })
      ));
    }

    // Payment status notification
    if (paymentStatus) {
      const payLabel =
        paymentStatus === "PAID"         ? "Paid" :
        paymentStatus === "PARTIALLY_PAID" ? "Partially Paid" :
        paymentStatus === "PENDING"      ? "Pending" : paymentStatus;

      const payMsg = paymentStatus === "PAID"
        ? `Payment received for Order #${order.orderNumber}. Your invoice has been marked as Paid.`
        : paymentStatus === "PARTIALLY_PAID"
        ? `A partial payment has been recorded for Order #${order.orderNumber}.`
        : `Payment status for Order #${order.orderNumber} has been updated to ${payLabel}.`;

      notifPromises.push(prisma.notification.create({
        data: {
          userId:  order.userId,
          orderId: order.id,
          type:    "payment_update",
          title:   `Payment ${payLabel} — Order #${order.orderNumber}`,
          message: payMsg,
        },
      }));

      superiors.forEach(u => notifPromises.push(
        prisma.notification.create({
          data: {
            userId:  u.id,
            orderId: order.id,
            type:    "payment_update",
            title:   `Payment ${payLabel} — Order #${order.orderNumber}`,
            message: `${order.user?.name ?? "A customer"}'s payment for Order #${order.orderNumber} has been marked as ${payLabel}.`,
          },
        })
      ));
    }

    await Promise.all(notifPromises);

    return NextResponse.json({ data: order });
  } catch (err) {
    console.error("[admin/orders/id] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE: cancel / delete order ────────────────────────────────────────────
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await checkAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const msg = `Order #${order.orderNumber} has been cancelled by the Administrator.`;

    // Notify customer
    const customerNotif = prisma.notification.create({
      data: {
        userId:  order.userId,
        orderId: order.id,
        type:    "order_cancelled",
        title:   `Order #${order.orderNumber} Cancelled`,
        message: msg,
      },
    });

    // Notify superior customers
    const superiors = await prisma.user.findMany({
      where: { role: "SUPERIOR_CUSTOMER" },
      select: { id: true },
    });
    const superiorNotifs = superiors.map(u =>
      prisma.notification.create({
        data: {
          userId:  u.id,
          orderId: order.id,
          type:    "order_cancelled",
          title:   `Order #${order.orderNumber} Cancelled`,
          message: `${order.user?.name ?? "A customer"}'s ${msg.toLowerCase()}`,
        },
      })
    );

    await Promise.all([customerNotif, ...superiorNotifs]);

    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/orders/id] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

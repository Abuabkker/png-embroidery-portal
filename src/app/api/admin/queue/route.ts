import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() { const s = await auth(); if(!s?.user) return null; const r=(s.user as any).role; return (r==="ADMIN"||r==="SUPER_ADMIN")?s:null; }
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const queue = await prisma.customizationReview.findMany({ include: { order: { include: { user: { select: { name: true, email: true } }, items: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: queue });
}
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { reviewId, status, adminComment } = await req.json();
  const review = await prisma.customizationReview.update({ where: { id: reviewId }, data: { status, adminComment, reviewedBy: (session.user as any).id, reviewedAt: new Date() } });
  if (status === "APPROVED") {
    await prisma.order.update({ where: { id: review.orderId }, data: { status: "PROOF_APPROVED" } });
  }
  return NextResponse.json({ data: review });
}

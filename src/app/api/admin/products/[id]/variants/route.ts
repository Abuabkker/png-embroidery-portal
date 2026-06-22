import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: [{ color: "asc" }, { size: "asc" }],
    });
    return NextResponse.json({ data: variants });
  } catch (err) {
    console.error("[admin/products/id/variants] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  // Expects: [{ size, color, stockQty }] — full replacement of all variants for this product
  const body: { size: string; color: string; stockQty: number }[] = await req.json();

  await prisma.productVariant.deleteMany({ where: { productId: id } });
  const variants = await prisma.productVariant.createMany({
    data: body.map(v => ({ productId: id, size: v.size, color: v.color, stockQty: v.stockQty })),
  });

  return NextResponse.json({ data: variants });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  // Expects: { size, color, stockQty } — update a single variant's stock
  const { size, color, stockQty } = await req.json();

  const variant = await prisma.productVariant.upsert({
    where: { productId_size_color: { productId: id, size: size ?? "", color: color ?? "" } },
    update: { stockQty },
    create: { productId: id, size: size ?? "", color: color ?? "", stockQty },
  });

  return NextResponse.json({ data: variant });
}

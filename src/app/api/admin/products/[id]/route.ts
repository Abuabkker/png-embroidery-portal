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
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: product });
  } catch (err) {
    console.error("[admin/products/id] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.name             !== undefined) data.name              = body.name;
    if (body.description      !== undefined) data.description       = body.description || null;
    if (body.categoryId       !== undefined) data.categoryId        = body.categoryId;
    if (body.basePrice        !== undefined) data.basePrice         = parseFloat(body.basePrice);
    if (body.customSurcharge  !== undefined) data.customSurcharge   = parseFloat(body.customSurcharge || "0");
    if (body.isCustomizable   !== undefined) data.isCustomizable    = body.isCustomizable;
    if (body.isActive         !== undefined) data.isActive          = body.isActive;
    if (body.stockQty         !== undefined) data.stockQty          = parseInt(body.stockQty);
    if (body.lowStockThreshold!== undefined) data.lowStockThreshold = parseInt(body.lowStockThreshold || "10");
    if (body.imageUrl         !== undefined) data.imageUrl          = body.imageUrl || null;
    if (body.tags             !== undefined) data.tags              = body.tags;
    if (body.sizes            !== undefined) data.sizes             = body.sizes;
    if (body.colors           !== undefined) data.colors            = body.colors;
    if (body.sku              !== undefined) data.sku               = body.sku || null;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: true },
    });
    return NextResponse.json({ data: product });
  } catch (err) {
    console.error("[admin/products/id] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/products/id] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const s = await auth();
  if (!s?.user) return null;
  const r = (s.user as any).role;
  return r === "ADMIN" || r === "SUPER_ADMIN" ? s : null;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base;
  let i = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // active | inactive | all

    const where: any = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status === "active")   where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: products });
  } catch (err) {
    console.error("[admin/products] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const {
      name, description, categoryId, basePrice, customSurcharge,
      isCustomizable, isActive, stockQty, lowStockThreshold,
      imageUrl, tags, sizes, colors, sku,
    } = body;

    if (!name || !categoryId || !basePrice) {
      return NextResponse.json({ error: "name, categoryId and basePrice are required" }, { status: 400 });
    }

    const slug = await uniqueSlug(toSlug(name));

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description:      description   || null,
        categoryId,
        basePrice:        parseFloat(basePrice),
        customSurcharge:  parseFloat(customSurcharge  || "0"),
        isCustomizable:   isCustomizable ?? false,
        isActive:         isActive        ?? true,
        stockQty:         parseInt(stockQty           || "0"),
        lowStockThreshold:parseInt(lowStockThreshold  || "10"),
        imageUrl:         imageUrl       || null,
        tags:             tags           || [],
        sizes:            sizes          || [],
        colors:           colors         || [],
        sku:              sku            || null,
      },
      include: { category: true },
    });
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err) {
    console.error("[admin/products] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

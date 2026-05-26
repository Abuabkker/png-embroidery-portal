import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() { const s = await auth(); if(!s?.user) return null; const r=(s.user as any).role; return (r==="ADMIN"||r==="SUPER_ADMIN")?s:null; }
export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  const products = await prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: products });
}
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const product = await prisma.product.create({ data: body, include: { category: true } });
  return NextResponse.json({ data: product }, { status: 201 });
}

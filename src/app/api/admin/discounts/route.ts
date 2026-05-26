import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function checkAdmin() { const s = await auth(); if(!s?.user) return null; const r=(s.user as any).role; return (r==="ADMIN"||r==="SUPER_ADMIN")?s:null; }
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: codes });
}
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const code = await prisma.discountCode.create({ data: body });
  return NextResponse.json({ data: code }, { status: 201 });
}

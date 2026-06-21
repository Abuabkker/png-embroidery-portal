import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const ALLOWED_ROLES: Role[] = [Role.CUSTOMER, Role.SUPERIOR_CUSTOMER];

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const assignedRole: Role = ALLOWED_ROLES.includes(role as Role) ? (role as Role) : Role.CUSTOMER;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  const user   = await prisma.user.create({ data: { name, email, password: hashed, role: assignedRole } });
  return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
}

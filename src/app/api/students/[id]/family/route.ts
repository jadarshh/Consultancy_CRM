import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FamilyRelationship } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const familyMembers = await prisma.familyMember.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(familyMembers);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const body = await req.json();

  const {
    relationship,
    name,
    occupation,
    employer,
    annualIncome,
    phone,
    email,
    education,
    address,
    isSponsor,
    incomeSource,
    incomeCurrency,
  } = body;

  const familyMember = await prisma.familyMember.create({
    data: {
      studentId: id,
      relationship: relationship as FamilyRelationship,
      name,
      occupation: occupation ?? null,
      employer: employer ?? null,
      annualIncome: annualIncome != null && annualIncome !== "" ? parseFloat(annualIncome) : null,
      phone: phone ?? null,
      email: email ?? null,
      education: education ?? null,
      address: address ?? null,
      isSponsor: isSponsor ?? false,
      incomeSource: incomeSource ?? null,
      incomeCurrency: incomeCurrency ?? "USD",
    },
  });

  return NextResponse.json(familyMember, { status: 201 });
}

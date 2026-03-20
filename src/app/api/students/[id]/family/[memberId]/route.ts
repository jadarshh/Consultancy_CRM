import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FamilyRelationship } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;

  const existing = await prisma.familyMember.findFirst({
    where: { id: memberId, studentId: id },
  });
  if (!existing) return NextResponse.json({ error: "Family member not found" }, { status: 404 });

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

  const updateData: Record<string, unknown> = {};
  if (relationship !== undefined) updateData.relationship = relationship as FamilyRelationship;
  if (name !== undefined) updateData.name = name;
  if (occupation !== undefined) updateData.occupation = occupation;
  if (employer !== undefined) updateData.employer = employer;
  if (annualIncome !== undefined) {
    updateData.annualIncome = annualIncome != null && annualIncome !== "" ? parseFloat(annualIncome) : null;
  }
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (education !== undefined) updateData.education = education;
  if (address !== undefined) updateData.address = address;
  if (isSponsor !== undefined) updateData.isSponsor = isSponsor;
  if (incomeSource !== undefined) updateData.incomeSource = incomeSource;
  if (incomeCurrency !== undefined) updateData.incomeCurrency = incomeCurrency;

  const updated = await prisma.familyMember.update({
    where: { id: memberId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;

  const existing = await prisma.familyMember.findFirst({
    where: { id: memberId, studentId: id },
  });
  if (!existing) return NextResponse.json({ error: "Family member not found" }, { status: 404 });

  await prisma.familyMember.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}

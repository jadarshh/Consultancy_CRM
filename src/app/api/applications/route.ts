import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "";

  const where = {
    ...(status && { status: status as never }),
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, referenceNumber: true } },
      program: {
        include: {
          university: {
            include: { country: { select: { name: true, code: true, flagEmoji: true } } },
          },
        },
      },
      intake: { select: { id: true, name: true, startDate: true } },
    },
  });

  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { studentId, programId, intakeId, notes } = body;

  if (!studentId || !programId) {
    return NextResponse.json(
      { error: "studentId and programId are required" },
      { status: 400 }
    );
  }

  // Generate application number: APP-YYYY-XXXXX
  const year = new Date().getFullYear();
  const count = await prisma.application.count();
  const applicationNumber = `APP-${year}-${String(count + 1).padStart(5, "0")}`;

  const application = await prisma.application.create({
    data: {
      applicationNumber,
      studentId,
      programId,
      intakeId: intakeId || null,
      status: "DRAFT",
      notes: notes || null,
      assignedToId: session.user.id,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      program: {
        include: {
          university: {
            include: { country: { select: { name: true, code: true, flagEmoji: true } } },
          },
        },
      },
      intake: true,
    },
  });

  // Create initial history entry
  await prisma.applicationHistory.create({
    data: {
      applicationId: application.id,
      fromStatus: null,
      toStatus: "DRAFT",
      changedById: session.user.id,
      notes: "Application created",
    },
  });

  return NextResponse.json(application, { status: 201 });
}

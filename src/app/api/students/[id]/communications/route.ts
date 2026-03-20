import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: studentId } = await params;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const communications = await prisma.communicationLog.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      loggedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(communications);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: studentId } = await params;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    type,
    direction,
    subject,
    summary,
    outcome,
    followUpDate,
    durationMinutes,
    phoneNumber,
    emailAddress,
  } = body;

  if (!type || !direction || !summary) {
    return NextResponse.json({ error: "Missing required fields: type, direction, summary" }, { status: 400 });
  }

  const communication = await prisma.communicationLog.create({
    data: {
      studentId,
      type,
      direction,
      subject: subject || null,
      summary,
      outcome: outcome || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      phoneNumber: phoneNumber || null,
      emailAddress: emailAddress || null,
      loggedById: session.user.id,
    },
    include: {
      loggedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(communication, { status: 201 });
}

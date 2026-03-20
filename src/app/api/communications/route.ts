import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const studentId = searchParams.get("studentId");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER";

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (!isAdmin) where.loggedById = session.user.id;

  const communications = await prisma.communicationLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, referenceNumber: true } },
      loggedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(communications);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    studentId,
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

  if (!studentId || !type || !direction || !summary) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      student: { select: { id: true, firstName: true, lastName: true, referenceNumber: true } },
      loggedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(communication, { status: 201 });
}

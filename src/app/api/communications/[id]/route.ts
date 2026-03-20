import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const communication = await prisma.communicationLog.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, referenceNumber: true } },
      loggedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!communication) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER";
  if (!isAdmin && communication.loggedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(communication);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.communicationLog.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER";
  if (!isAdmin && existing.loggedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const updated = await prisma.communicationLog.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(direction !== undefined && { direction }),
      ...(subject !== undefined && { subject: subject || null }),
      ...(summary !== undefined && { summary }),
      ...(outcome !== undefined && { outcome: outcome || null }),
      ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
      ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? parseInt(durationMinutes) : null }),
      ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null }),
      ...(emailAddress !== undefined && { emailAddress: emailAddress || null }),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, referenceNumber: true } },
      loggedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.communicationLog.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER";
  if (!isAdmin && existing.loggedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.communicationLog.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

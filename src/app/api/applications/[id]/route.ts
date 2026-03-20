import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          referenceNumber: true,
          phonePrimary: true,
        },
      },
      program: {
        include: {
          university: {
            include: { country: true },
          },
          requirements: true,
        },
      },
      intake: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { firstName: true, lastName: true } } },
      },
      applicationDocs: {
        include: { document: true },
      },
      applicationNotes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  return NextResponse.json(application);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  const prevStatus = application.status;

  if (body.status !== undefined) updateData.status = body.status;
  if (body.offerDate !== undefined) updateData.offerDate = body.offerDate ? new Date(body.offerDate) : null;
  if (body.depositPaid !== undefined) updateData.depositPaid = body.depositPaid;
  if (body.universityRef !== undefined) updateData.universityRef = body.universityRef;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.submissionDate !== undefined) updateData.submissionDate = body.submissionDate ? new Date(body.submissionDate) : null;

  const updated = await prisma.application.update({
    where: { id },
    data: updateData,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      program: {
        include: {
          university: {
            include: { country: true },
          },
        },
      },
      intake: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { changedBy: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  // Log status change to ApplicationHistory
  if (body.status !== undefined && body.status !== prevStatus) {
    await prisma.applicationHistory.create({
      data: {
        applicationId: id,
        fromStatus: prevStatus,
        toStatus: body.status,
        changedById: session.user.id,
        notes: body.statusNote || null,
      },
    });
  }

  return NextResponse.json(updated);
}

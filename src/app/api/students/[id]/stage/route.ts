import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "RECEPTIONIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { stage, notes } = body;

  if (!stage) {
    return NextResponse.json({ error: "stage is required" }, { status: 400 });
  }

  const current = await prisma.student.findUnique({
    where: { id },
    select: { stage: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const previousStage = current.stage;

  const [student] = await prisma.$transaction([
    prisma.student.update({
      where: { id },
      data: { stage: stage as never },
    }),
    prisma.activityLog.create({
      data: {
        entityType: "Student",
        entityId: id,
        action: "STAGE_CHANGED",
        changes: {
          from: previousStage,
          to: stage,
          ...(notes ? { notes } : {}),
        },
        performedById: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(student);
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseType, CourseStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, courseId } = await params;

  const existing = await prisma.studentCourse.findFirst({
    where: { id: courseId, studentId: id },
  });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await req.json();
  const { courseType, instituteName, status, startDate, endDate, score, notes } = body;

  const updateData: Record<string, unknown> = {};
  if (courseType !== undefined) updateData.courseType = courseType as CourseType;
  if (instituteName !== undefined) updateData.instituteName = instituteName;
  if (status !== undefined) updateData.status = status as CourseStatus;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (score !== undefined) updateData.score = score;
  if (notes !== undefined) updateData.notes = notes;

  const updated = await prisma.studentCourse.update({
    where: { id: courseId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, courseId } = await params;

  const existing = await prisma.studentCourse.findFirst({
    where: { id: courseId, studentId: id },
  });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  await prisma.studentCourse.delete({ where: { id: courseId } });

  return NextResponse.json({ success: true });
}

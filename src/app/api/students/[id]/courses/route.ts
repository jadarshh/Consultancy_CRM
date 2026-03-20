import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseType, CourseStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const courses = await prisma.studentCourse.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
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
  const { courseType, instituteName, status, startDate, endDate, score, notes } = body;

  const course = await prisma.studentCourse.create({
    data: {
      studentId: id,
      courseType: courseType as CourseType,
      instituteName: instituteName ?? null,
      status: (status ?? "NEEDS") as CourseStatus,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      score: score ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(course, { status: 201 });
}

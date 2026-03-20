import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "";
  const studentId = searchParams.get("studentId") || "";

  const isAll = session.user.role === "ADMIN" || session.user.role === "MANAGER";

  const where = {
    ...(isAll ? {} : { assignedToId: session.user.id }),
    ...(status && { status: status as never }),
    ...(studentId && { studentId }),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, studentId, assignedToId, priority, dueDate } = body;

  if (!title || !assignedToId || !dueDate) {
    return NextResponse.json(
      { error: "title, assignedToId, and dueDate are required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      studentId: studentId || null,
      assignedToId,
      assignedById: session.user.id,
      priority: priority || "MEDIUM",
      dueDate: new Date(dueDate),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}

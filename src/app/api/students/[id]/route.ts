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

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      assignedCounselor: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      academicRecords: { orderBy: { createdAt: "desc" } },
      testScores: { orderBy: { testDate: "desc" } },
      workExperiences: { orderBy: { startDate: "desc" } },
      familyMembers: true,
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
          verifiedBy: { select: { firstName: true, lastName: true } },
        },
      },
      communicationLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          loggedBy: { select: { firstName: true, lastName: true } },
        },
      },
      studentNotes: {
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          program: {
            include: { university: { include: { country: true } } },
          },
          intake: true,
        },
      },
      tasks: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        orderBy: { dueDate: "asc" },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Sanitize: strip fields that should not be updated via PATCH
  const {
    id: _id,
    referenceNumber: _ref,
    createdById: _createdById,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...updateData
  } = body;

  // Parse date fields
  const dateFields = [
    "dateOfBirth",
    "passportExpiryDate",
    "passportIssueDate",
  ] as const;
  for (const field of dateFields) {
    if (field in updateData && updateData[field]) {
      updateData[field] = new Date(updateData[field]);
    } else if (field in updateData && updateData[field] === "") {
      updateData[field] = null;
    }
  }

  // Parse decimal fields
  const decimalFields = [
    "budgetMin",
    "budgetMax",
    "annualFamilyIncome",
    "bankBalance",
  ] as const;
  for (const field of decimalFields) {
    if (field in updateData && updateData[field] !== null && updateData[field] !== "") {
      updateData[field] = parseFloat(updateData[field]);
    } else if (field in updateData && (updateData[field] === null || updateData[field] === "")) {
      updateData[field] = null;
    }
  }

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(student);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const { id } = await params;

  const student = await prisma.student.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, id: student.id });
}

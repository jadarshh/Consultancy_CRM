import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const stage = searchParams.get("stage") || "";
  const counselorId = searchParams.get("counselorId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const isAll =
    session.user.role === "ADMIN" || session.user.role === "MANAGER";

  const where = {
    isActive: true,
    ...(isAll ? {} : { assignedCounselorId: session.user.id }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phonePrimary: { contains: search, mode: "insensitive" as const } },
        { referenceNumber: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(stage && { stage: stage as never }),
    ...(counselorId && { assignedCounselorId: counselorId }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      include: {
        assignedCounselor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    students,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { firstName, lastName, email, phonePrimary, source } = body;
  if (!firstName || !lastName || !email || !phonePrimary || !source) {
    return NextResponse.json(
      { error: "firstName, lastName, email, phonePrimary, and source are required" },
      { status: 400 }
    );
  }

  // Generate reference number: STU-YYYY-XXXXX
  const year = new Date().getFullYear();
  const count = await prisma.student.count();
  const referenceNumber = `STU-${year}-${String(count + 1).padStart(5, "0")}`;

  // Parse optional date fields
  const parseDate = (val: unknown) =>
    val ? new Date(val as string) : undefined;

  const student = await prisma.student.create({
    data: {
      referenceNumber,
      firstName,
      lastName,
      email,
      phonePrimary,
      source,
      // Optional fields
      whatsappNumber: body.whatsappNumber || null,
      priority: body.priority || "MEDIUM",
      dateOfBirth: parseDate(body.dateOfBirth) ?? null,
      gender: body.gender || null,
      nationality: body.nationality || null,
      maritalStatus: body.maritalStatus || null,
      preferredCountries: body.preferredCountries || [],
      preferredLevel: body.preferredLevel || null,
      preferredField: body.preferredField || null,
      preferredIntake: body.preferredIntake || null,
      budgetMin: body.budgetMin ? parseFloat(body.budgetMin) : null,
      budgetMax: body.budgetMax ? parseFloat(body.budgetMax) : null,
      budgetCurrency: body.budgetCurrency || "USD",
      passportNumber: body.passportNumber || null,
      passportExpiryDate: parseDate(body.passportExpiryDate) ?? null,
      passportIssueDate: parseDate(body.passportIssueDate) ?? null,
      currentCity: body.currentCity || null,
      currentState: body.currentState || null,
      currentCountry: body.currentCountry || null,
      currentAddress: body.currentAddress || null,
      fundingSource: body.fundingSource || null,
      annualFamilyIncome: body.annualFamilyIncome
        ? parseFloat(body.annualFamilyIncome)
        : null,
      incomeCurrency: body.incomeCurrency || "USD",
      bankBalance: body.bankBalance ? parseFloat(body.bankBalance) : null,
      assignedCounselorId: body.assignedCounselorId || null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(student, { status: 201 });
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const countries = await prisma.country.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          universities: { where: { isActive: true } },
          requirements: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(countries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, code, flagEmoji, currency, workRights, postStudyWork, livingCostRange, healthInsuranceRequired } = body;

  if (!name || !code) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 });
  }

  const country = await prisma.country.create({
    data: {
      name,
      code: code.toUpperCase(),
      flagEmoji: flagEmoji || null,
      currency: currency || "USD",
      workRights: workRights || null,
      postStudyWork: postStudyWork || null,
      livingCostRange: livingCostRange || null,
      healthInsuranceRequired: healthInsuranceRequired === true || healthInsuranceRequired === "true",
    },
  });

  return NextResponse.json(country, { status: 201 });
}

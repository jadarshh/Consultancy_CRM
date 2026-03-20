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

  const country = await prisma.country.findUnique({
    where: { id },
    include: {
      requirements: true,
      universities: {
        where: { isActive: true },
        include: {
          _count: { select: { programs: { where: { isActive: true } } } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!country) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(country);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const country = await prisma.country.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.code !== undefined && { code: body.code.toUpperCase() }),
      ...(body.flagEmoji !== undefined && { flagEmoji: body.flagEmoji }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.workRights !== undefined && { workRights: body.workRights }),
      ...(body.postStudyWork !== undefined && { postStudyWork: body.postStudyWork }),
      ...(body.livingCostRange !== undefined && { livingCostRange: body.livingCostRange }),
      ...(body.healthInsuranceRequired !== undefined && { healthInsuranceRequired: body.healthInsuranceRequired }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.visaInfo !== undefined && { visaInfo: body.visaInfo }),
    },
  });

  return NextResponse.json(country);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.country.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

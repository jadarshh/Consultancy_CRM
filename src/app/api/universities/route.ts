import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const countryId = searchParams.get("countryId") || "";

  const universities = await prisma.university.findMany({
    where: {
      isActive: true,
      ...(countryId && { countryId }),
    },
    include: {
      country: {
        select: { id: true, name: true, code: true, flagEmoji: true },
      },
      _count: {
        select: { programs: { where: { isActive: true } } },
      },
    },
    orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(universities);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, countryId, city } = body;

  if (!name || !countryId || !city) {
    return NextResponse.json({ error: "name, countryId, and city are required" }, { status: 400 });
  }

  const university = await prisma.university.create({
    data: {
      name,
      countryId,
      city,
      shortName: body.shortName || null,
      state: body.state || null,
      type: body.type || "PUBLIC",
      rankingGlobal: body.rankingGlobal ? parseInt(body.rankingGlobal) : null,
      rankingNational: body.rankingNational ? parseInt(body.rankingNational) : null,
      isPartner: body.isPartner === true || body.isPartner === "true",
      commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : null,
      website: body.website || null,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(university, { status: 201 });
}

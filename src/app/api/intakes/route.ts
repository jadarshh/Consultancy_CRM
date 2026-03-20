import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const countryId = searchParams.get("countryId") || "";

  const where = {
    isActive: true,
    ...(countryId && { countryId }),
  };

  const intakes = await prisma.intake.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: {
      country: { select: { id: true, name: true, code: true, flagEmoji: true } },
    },
  });

  return NextResponse.json(intakes);
}

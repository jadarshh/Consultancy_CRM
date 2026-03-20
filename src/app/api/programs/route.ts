import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const countryId = searchParams.get("countryId") || "";

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { field: { contains: search, mode: "insensitive" as const } },
        { university: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(countryId && { university: { countryId } }),
  };

  const programs = await prisma.program.findMany({
    where,
    orderBy: { name: "asc" },
    take: 50,
    include: {
      university: {
        include: {
          country: { select: { id: true, name: true, code: true, flagEmoji: true } },
        },
      },
    },
  });

  return NextResponse.json(programs);
}

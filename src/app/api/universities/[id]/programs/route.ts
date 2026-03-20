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

  const programs = await prisma.program.findMany({
    where: { universityId: id, isActive: true },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(programs);
}

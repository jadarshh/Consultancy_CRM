import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

  const university = await prisma.university.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.shortName !== undefined && { shortName: body.shortName }),
      ...(body.countryId !== undefined && { countryId: body.countryId }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.rankingGlobal !== undefined && {
        rankingGlobal: body.rankingGlobal ? parseInt(body.rankingGlobal) : null,
      }),
      ...(body.rankingNational !== undefined && {
        rankingNational: body.rankingNational ? parseInt(body.rankingNational) : null,
      }),
      ...(body.isPartner !== undefined && { isPartner: body.isPartner }),
      ...(body.commissionRate !== undefined && {
        commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : null,
      }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
      ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json(university);
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

  await prisma.university.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

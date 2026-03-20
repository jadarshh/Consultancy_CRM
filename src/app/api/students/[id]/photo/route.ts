import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const formData = await req.formData();
  const photo = formData.get("photo") as File | null;

  if (!photo) return NextResponse.json({ error: "No photo provided" }, { status: 400 });

  const originalName = photo.name;
  const ext = path.extname(originalName) || ".jpg";
  const timestamp = Date.now();
  const filename = `photo-${timestamp}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", id);
  const filePath = path.join(uploadDir, filename);

  mkdirSync(uploadDir, { recursive: true });

  // Remove old photo if it exists
  if (student.photoUrl) {
    const oldFilePath = path.join(process.cwd(), "public", student.photoUrl);
    if (existsSync(oldFilePath)) {
      unlinkSync(oldFilePath);
    }
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  writeFileSync(filePath, buffer);

  const photoUrl = `/uploads/${id}/${filename}`;

  const updated = await prisma.student.update({
    where: { id },
    data: { photoUrl },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (student.photoUrl) {
    const filePath = path.join(process.cwd(), "public", student.photoUrl);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  const updated = await prisma.student.update({
    where: { id },
    data: { photoUrl: null },
  });

  return NextResponse.json(updated);
}

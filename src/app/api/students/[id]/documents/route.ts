import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const documents = await prisma.studentDocument.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true } },
      verifiedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(documents);
}

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
  const file = formData.get("file") as File | null;
  const documentType = formData.get("documentType") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!documentType) return NextResponse.json({ error: "documentType is required" }, { status: 400 });

  const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "image/jpeg", "image/png", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20 MB

  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, images, or Word documents are allowed" }, { status: 400 });
  }
  if (file.size > MAX_DOC_SIZE) {
    return NextResponse.json({ error: "File must be smaller than 20 MB" }, { status: 400 });
  }

  // Sanitize filename — strip path separators
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const originalName = safeName;
  const filename = `${Date.now()}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", id);
  const filePath = path.join(uploadDir, filename);

  mkdirSync(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/${id}/${filename}`;

  const document = await prisma.studentDocument.create({
    data: {
      studentId: id,
      documentType: documentType as DocumentType,
      fileName: originalName,
      fileUrl,
      fileSize: buffer.length,
      mimeType: file.type || null,
      uploadedById: session.user.id,
      notes: notes || null,
    },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(document, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  if (!docId) return NextResponse.json({ error: "docId query parameter is required" }, { status: 400 });

  const document = await prisma.studentDocument.findFirst({
    where: { id: docId, studentId: id },
  });

  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Remove file from disk
  const filePath = path.join(process.cwd(), "public", document.fileUrl);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }

  await prisma.studentDocument.delete({ where: { id: docId } });

  return NextResponse.json({ success: true });
}

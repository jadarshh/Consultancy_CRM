import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatCurrency, snakeToTitle } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-neutral",
  DOCUMENTS_PENDING: "badge-warning",
  READY_TO_SUBMIT: "badge-info",
  SUBMITTED: "badge-info",
  UNDER_REVIEW: "badge-info",
  CONDITIONAL_OFFER: "badge-success",
  UNCONDITIONAL_OFFER: "badge-success",
  OFFER_ACCEPTED: "badge-success",
  OFFER_DECLINED: "badge-danger",
  TUITION_DEPOSIT_PAID: "badge-success",
  VISA_APPLIED: "badge-primary",
  VISA_APPROVED: "badge-success",
  VISA_REFUSED: "badge-danger",
  ENROLLED: "badge-success",
  WITHDRAWN: "badge-danger",
  REJECTED: "badge-danger",
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          referenceNumber: true,
          phonePrimary: true,
        },
      },
      program: {
        include: {
          university: {
            include: { country: true },
          },
        },
      },
      intake: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { firstName: true, lastName: true } } },
      },
      applicationNotes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!application) notFound();

  const badgeClass = STATUS_BADGE[application.status] || "badge-neutral";

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Back */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-sm hover:underline"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Applications
      </Link>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {application.program.name}
              </h1>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "var(--primary-50)", color: "var(--primary)" }}
              >
                {application.applicationNumber}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {application.program.university.name} · {application.program.university.country.name}
              {application.program.university.country.flagEmoji && ` ${application.program.university.country.flagEmoji}`}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`badge ${badgeClass}`}>{snakeToTitle(application.status)}</span>
              <span className="badge badge-neutral">{snakeToTitle(application.program.level)}</span>
              {application.intake && (
                <span className="badge badge-info">{application.intake.name}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              {formatCurrency(Number(application.program.tuitionFee), application.program.feeCurrency)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>per year</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Student Info */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Student</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Name</span>
                <Link
                  href={`/students/${application.student.id}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  {application.student.firstName} {application.student.lastName}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Reference</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {application.student.referenceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Email</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {application.student.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Phone</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {application.student.phonePrimary}
                </span>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Application Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Created</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {formatDate(application.createdAt)}
                </span>
              </div>
              {application.submissionDate && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Submitted</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {formatDate(application.submissionDate)}
                  </span>
                </div>
              )}
              {application.offerDate && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Offer Date</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {formatDate(application.offerDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Deposit Paid</span>
                <span
                  className={`badge ${application.depositPaid ? "badge-success" : "badge-neutral"}`}
                >
                  {application.depositPaid ? "Yes" : "No"}
                </span>
              </div>
              {application.universityRef && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>University Ref</span>
                  <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                    {application.universityRef}
                  </span>
                </div>
              )}
              {application.notes && (
                <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Notes</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                    {application.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {application.applicationNotes.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Notes</h3>
              <div className="space-y-3">
                {application.applicationNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg" style={{ background: "var(--background)" }}>
                    <p className="text-sm" style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                      {note.content}
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      {note.createdBy.firstName} {note.createdBy.lastName} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Status History */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Status History</h3>
            {application.statusHistory.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No history yet</p>
            ) : (
              <div className="space-y-3">
                {application.statusHistory.map((h) => (
                  <div
                    key={h.id}
                    className="border-l-2 pl-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {h.fromStatus && (
                        <>
                          <span className="badge badge-neutral text-[10px]">
                            {snakeToTitle(h.fromStatus)}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>→</span>
                        </>
                      )}
                      <span className={`badge ${STATUS_BADGE[h.toStatus] || "badge-neutral"} text-[10px]`}>
                        {snakeToTitle(h.toStatus)}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      by {h.changedBy.firstName} {h.changedBy.lastName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(h.createdAt)}
                    </p>
                    {h.notes && (
                      <p className="text-xs mt-1 italic" style={{ color: "var(--text-secondary)" }}>
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Program Info */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Program</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Level</span>
                <span className="badge badge-neutral">{snakeToTitle(application.program.level)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Field</span>
                <span className="text-xs text-right" style={{ color: "var(--text-secondary)" }}>
                  {application.program.field}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Duration</span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {application.program.durationMonths} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tuition</span>
                <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  {formatCurrency(Number(application.program.tuitionFee), application.program.feeCurrency)}/yr
                </span>
              </div>
              {application.program.applicationFee && (
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>App Fee</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {formatCurrency(Number(application.program.applicationFee), application.program.feeCurrency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

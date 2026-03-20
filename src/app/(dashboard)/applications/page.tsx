import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate, snakeToTitle } from "@/lib/utils";
import { StatusFilter } from "@/components/applications/StatusFilter";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const APPLICATION_STATUS_BADGE: Record<string, string> = {
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
  CAS_REQUESTED: "badge-warning",
  CAS_RECEIVED: "badge-info",
  COE_REQUESTED: "badge-warning",
  COE_RECEIVED: "badge-info",
  I20_REQUESTED: "badge-warning",
  I20_RECEIVED: "badge-info",
  VISA_DOCUMENTS_READY: "badge-info",
  VISA_APPLIED: "badge-primary",
  VISA_INTERVIEW_SCHEDULED: "badge-primary",
  VISA_APPROVED: "badge-success",
  VISA_REFUSED: "badge-danger",
  ENROLLED: "badge-success",
  DEFERRED: "badge-warning",
  WITHDRAWN: "badge-danger",
  REJECTED: "badge-danger",
};


export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) return null;

  const { status } = await searchParams;

  const where = {
    ...(status && { status: status as never }),
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, referenceNumber: true } },
      program: {
        include: {
          university: {
            include: { country: { select: { name: true, code: true, flagEmoji: true } } },
          },
        },
      },
      intake: { select: { id: true, name: true, startDate: true } },
    },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Applications</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/applications/new" className="btn btn-primary">
          + New Application
        </Link>
      </div>

      {/* Filter */}
      <StatusFilter currentStatus={status} />

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No applications found. Create one to get started.
            </p>
            <Link href="/applications/new" className="btn btn-primary mt-4 inline-flex">
              + New Application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Program</th>
                  <th>University</th>
                  <th>Country</th>
                  <th>Intake</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div>
                        <Link
                          href={`/students/${app.student.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: "var(--primary)" }}
                        >
                          {app.student.firstName} {app.student.lastName}
                        </Link>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {app.student.referenceNumber}
                        </p>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {app.program.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {snakeToTitle(app.program.level)}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {app.program.university.name}
                      </p>
                    </td>
                    <td>
                      <span className="text-xl" title={app.program.university.country.name}>
                        {app.program.university.country.flagEmoji || app.program.university.country.code}
                      </span>
                    </td>
                    <td>
                      {app.intake ? (
                        <span className="badge badge-neutral">{app.intake.name}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${APPLICATION_STATUS_BADGE[app.status] || "badge-neutral"}`}>
                        {snakeToTitle(app.status)}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {app.submissionDate ? formatDate(app.submissionDate) : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/applications/${app.id}`}
                        className="btn btn-secondary text-xs px-3 py-1.5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

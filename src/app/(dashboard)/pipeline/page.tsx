import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { STAGE_LABELS, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  CA: "🇨🇦", GB: "🇬🇧", AU: "🇦🇺", US: "🇺🇸", DE: "🇩🇪",
  NZ: "🇳🇿", IE: "🇮🇪", NL: "🇳🇱", FR: "🇫🇷", IN: "🇮🇳",
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "#DC2626", HIGH: "#E8913A", MEDIUM: "#D97706", LOW: "#94A3B8",
};

const PIPELINE_COLUMNS = [
  { stage: "NEW_INQUIRY", color: "#64748B" },
  { stage: "INITIAL_CONSULTATION", color: "#2563EB" },
  { stage: "PROFILE_ASSESSMENT", color: "#7C3AED" },
  { stage: "COUNTRY_SHORTLISTED", color: "#059669" },
  { stage: "DOCUMENTS_COLLECTION", color: "#B45309" },
  { stage: "APPLICATION_PREP", color: "#C2410C" },
  { stage: "APPLICATIONS_SUBMITTED", color: "#1D4ED8" },
  { stage: "OFFER_RECEIVED", color: "#16A34A" },
  { stage: "OFFER_ACCEPTED", color: "#15803D" },
  { stage: "VISA_APPLIED", color: "#7C3AED" },
  { stage: "VISA_APPROVED", color: "#059669" },
];

export default async function PipelinePage() {
  const session = await auth();
  if (!session) return null;

  const isAll = session.user.role === "ADMIN" || session.user.role === "MANAGER";
  const where = {
    isActive: true,
    stage: { notIn: ["ON_HOLD", "WITHDRAWN", "VISA_REFUSED", "NOT_QUALIFIED", "DEPARTED", "ENROLLED", "PRE_DEPARTURE"] as never[] },
    ...(isAll ? {} : { assignedCounselorId: session.user.id }),
  };

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ priority: "desc" }, { updatedAt: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      stage: true,
      priority: true,
      preferredCountries: true,
      updatedAt: true,
      assignedCounselor: { select: { firstName: true, lastName: true } },
    },
  });

  // Group by stage
  const grouped: Record<string, typeof students> = {};
  for (const col of PIPELINE_COLUMNS) {
    grouped[col.stage] = students.filter((s) => s.stage === col.stage);
  }

  function daysInStage(updatedAt: Date): number {
    return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Pipeline</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {students.length} active students
          </p>
        </div>
        <Link href="/students/new" className="btn btn-primary">+ Add Student</Link>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {PIPELINE_COLUMNS.map(({ stage, color }) => {
            const cards = grouped[stage] || [];
            return (
              <div key={stage} className="kanban-column p-3 space-y-2.5 flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {STAGE_LABELS[stage] || stage}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: color + "20", color: color }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 flex-1">
                  {cards.map((student) => {
                    const days = daysInStage(student.updatedAt);
                    const slowAlert = days > 14;

                    return (
                      <Link key={student.id} href={`/students/${student.id}`}>
                        <div
                          className="kanban-card"
                          style={slowAlert ? { borderLeft: "3px solid var(--warning)" } : undefined}
                        >
                          {/* Student Name */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                                style={{ background: "var(--primary)" }}
                              >
                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                                  {student.firstName} {student.lastName}
                                </p>
                                {student.assignedCounselor && (
                                  <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
                                    @{student.assignedCounselor.firstName}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Priority dot */}
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: PRIORITY_DOT[student.priority] || "#94A3B8" }}
                              title={student.priority}
                            />
                          </div>

                          {/* Countries */}
                          {student.preferredCountries.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {student.preferredCountries.slice(0, 3).map((c) => (
                                <span key={c} className="text-base" title={c}>
                                  {COUNTRY_FLAGS[c] || c}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Days in stage */}
                          <div className="mt-2 flex items-center gap-1">
                            {slowAlert && <span className="text-xs">⚠</span>}
                            <span
                              className="text-[10px]"
                              style={{ color: slowAlert ? "var(--warning)" : "var(--text-muted)" }}
                            >
                              {days}d in stage
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {cards.length === 0 && (
                    <div
                      className="text-center py-6 text-xs rounded-lg"
                      style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.5)" }}
                    >
                      No students
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal stages summary */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Terminal / Other Stages</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["ON_HOLD", "WITHDRAWN", "VISA_REFUSED", "ENROLLED", "DEPARTED", "NOT_QUALIFIED"].map(async (stage) => {
            const count = await prisma.student.count({ where: { isActive: true, stage: stage as never, ...(isAll ? {} : { assignedCounselorId: session.user.id }) } });
            return (
              <div key={stage} className="text-center p-3 rounded-xl" style={{ background: "var(--background)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{count}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{STAGE_LABELS[stage] || stage}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

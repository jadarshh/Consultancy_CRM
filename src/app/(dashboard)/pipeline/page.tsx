import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PipelineClientFilters } from "@/components/pipeline/PipelineClientFilters";

export const dynamic = "force-dynamic";

// ─── Plain-English Stage Labels ──────────────────────────────────────────────

const PLAIN_LABELS: Record<string, string> = {
  NEW_INQUIRY: "Just Walked In",
  INITIAL_CONSULTATION: "First Meeting Done",
  PROFILE_ASSESSMENT: "Profile Being Assessed",
  COUNTRY_SHORTLISTED: "Countries Chosen",
  DOCUMENTS_COLLECTION: "Collecting Documents",
  APPLICATION_PREP: "Preparing Application",
  APPLICATIONS_SUBMITTED: "Applied to Universities",
  OFFER_RECEIVED: "Got University Offer",
  OFFER_ACCEPTED: "Accepted the Offer",
  TUITION_DEPOSITED: "Paid Tuition Deposit",
  VISA_DOCUMENTS_PREP: "Preparing Visa Papers",
  VISA_APPLIED: "Visa Applied",
  VISA_APPROVED: "Visa Approved ✓",
  PRE_DEPARTURE: "Getting Ready to Leave",
  DEPARTED: "Left the Country",
  ENROLLED: "Enrolled at University ✓",
};

const COUNTRY_FLAGS: Record<string, string> = {
  CA: "🇨🇦", GB: "🇬🇧", AU: "🇦🇺", US: "🇺🇸", DE: "🇩🇪",
  NZ: "🇳🇿", IE: "🇮🇪", NL: "🇳🇱", FR: "🇫🇷", IN: "🇮🇳",
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "var(--danger)",
  HIGH: "#E8913A",
  MEDIUM: "var(--warning)",
  LOW: "var(--text-muted)",
};

// ─── Phase Definitions ────────────────────────────────────────────────────────

const PHASES = [
  {
    id: 1,
    name: "Inquiry",
    emoji: "👋",
    color: "#64748B",
    stages: ["NEW_INQUIRY", "INITIAL_CONSULTATION"],
  },
  {
    id: 2,
    name: "Planning",
    emoji: "🗺️",
    color: "#7C3AED",
    stages: ["PROFILE_ASSESSMENT", "COUNTRY_SHORTLISTED"],
  },
  {
    id: 3,
    name: "Preparation",
    emoji: "📋",
    color: "#B45309",
    stages: ["DOCUMENTS_COLLECTION", "APPLICATION_PREP"],
  },
  {
    id: 4,
    name: "Applying",
    emoji: "📬",
    color: "#1D4ED8",
    stages: ["APPLICATIONS_SUBMITTED", "OFFER_RECEIVED", "OFFER_ACCEPTED", "TUITION_DEPOSITED"],
  },
  {
    id: 5,
    name: "Visa",
    emoji: "🛂",
    color: "#7C3AED",
    stages: ["VISA_DOCUMENTS_PREP", "VISA_APPLIED", "VISA_APPROVED"],
  },
  {
    id: 6,
    name: "Departure",
    emoji: "✈️",
    color: "#059669",
    stages: ["PRE_DEPARTURE", "DEPARTED", "ENROLLED"],
  },
];

function daysInStage(updatedAt: Date): number {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; counselor?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const params = await searchParams;
  const q = params.q || "";
  const counselorFilter = params.counselor || "";

  const isAll = session.user.role === "ADMIN" || session.user.role === "MANAGER";

  const where = {
    isActive: true,
    stage: { notIn: ["WITHDRAWN", "NOT_QUALIFIED"] as never[] },
    ...(isAll ? {} : { assignedCounselorId: session.user.id }),
    ...(counselorFilter ? { assignedCounselorId: counselorFilter } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { referenceNumber: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [students, counselors, footerCounts] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ priority: "desc" }, { updatedAt: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referenceNumber: true,
        stage: true,
        priority: true,
        preferredCountries: true,
        preferredLevel: true,
        preferredField: true,
        updatedAt: true,
        assignedCounselor: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    isAll
      ? prisma.user.findMany({
          where: { isActive: true, role: { in: ["COUNSELOR", "MANAGER"] } },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { firstName: "asc" },
        })
      : Promise.resolve([]),
    Promise.all([
      prisma.student.count({ where: { isActive: true, stage: "VISA_APPLIED" as never, ...(isAll ? {} : { assignedCounselorId: session.user.id }) } }),
      prisma.student.count({ where: { isActive: true, stage: "OFFER_RECEIVED" as never, ...(isAll ? {} : { assignedCounselorId: session.user.id }) } }),
      prisma.student.count({ where: { isActive: true, stage: "ON_HOLD" as never, ...(isAll ? {} : { assignedCounselorId: session.user.id }) } }),
      prisma.student.count({
        where: {
          isActive: true,
          stage: "WITHDRAWN" as never,
          ...(isAll ? {} : { assignedCounselorId: session.user.id }),
          updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]),
  ]);

  const [visaPendingCount, offerReceivedCount, onHoldCount, withdrawnThisMonthCount] = footerCounts;

  // Group students by stage
  const byStage: Record<string, typeof students> = {};
  for (const s of students) {
    if (!byStage[s.stage]) byStage[s.stage] = [];
    byStage[s.stage].push(s);
  }

  // Students needing attention (stuck > 14 days)
  const stuckStudents = students.filter((s) => daysInStage(s.updatedAt) > 14);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Student Journey Pipeline
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Track where each student is in their study abroad journey
          </p>
        </div>
        <Link href="/students/new" className="btn btn-primary">
          + Add Student
        </Link>
      </div>

      {/* ── Search / Filter ── */}
      <PipelineClientFilters
        counselors={counselors}
        currentSearch={q}
        currentCounselor={counselorFilter}
      />

      {/* ── Phase Progress Bar ── */}
      <div className="card p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
          JOURNEY PHASES — {students.length} active student{students.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1">
          {PHASES.map((phase) => {
            const count = phase.stages.reduce((sum, s) => sum + (byStage[s]?.length || 0), 0);
            return (
              <div key={phase.id} className="flex-1 min-w-0">
                <div
                  className="h-2 rounded-full mb-1.5"
                  style={{ background: count > 0 ? phase.color : "var(--border)" }}
                />
                <div className="text-center">
                  <span className="text-[10px] font-semibold" style={{ color: phase.color }}>
                    {phase.emoji} {phase.name}
                  </span>
                  <br />
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Phase Sections ── */}
      <div className="space-y-5">
        {PHASES.map((phase) => {
          const phaseStudents = phase.stages.flatMap((s) => byStage[s] || []);
          if (phaseStudents.length === 0 && !q && !counselorFilter) return null;

          return (
            <div
              key={phase.id}
              className="card p-5"
              style={{ borderTop: `3px solid ${phase.color}` }}
            >
              {/* Phase Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{phase.emoji}</span>
                  <div>
                    <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                      Phase {phase.id}: {phase.name}
                    </h2>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {phase.stages.map((s) => PLAIN_LABELS[s]).join(" · ")}
                    </p>
                  </div>
                </div>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: phase.color + "18", color: phase.color }}
                >
                  {phaseStudents.length} student{phaseStudents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Sub-stage pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {phase.stages.map((stage) => {
                  const count = byStage[stage]?.length || 0;
                  return (
                    <span
                      key={stage}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background: count > 0 ? phase.color + "18" : "var(--background)",
                        color: count > 0 ? phase.color : "var(--text-muted)",
                        border: `1px solid ${count > 0 ? phase.color + "40" : "var(--border)"}`,
                      }}
                    >
                      {PLAIN_LABELS[stage]} ({count})
                    </span>
                  );
                })}
              </div>

              {/* Student cards grid */}
              {phaseStudents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phaseStudents.map((student) => {
                    const days = daysInStage(student.updatedAt);
                    const stuck = days > 14;
                    return (
                      <Link key={student.id} href={`/students/${student.id}`}>
                        <div
                          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer"
                          style={{
                            background: "var(--background)",
                            borderColor: stuck ? "var(--danger)" : "var(--border)",
                            borderWidth: stuck ? "2px" : "1px",
                          }}
                        >
                          {/* Top row: Avatar + Name + Priority */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: phase.color }}
                              >
                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="text-sm font-semibold leading-tight truncate"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {student.firstName} {student.lastName}
                                </p>
                                <p
                                  className="text-[10px] leading-tight font-mono"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {student.referenceNumber}
                                </p>
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{
                                background: (PRIORITY_COLOR[student.priority] || "var(--text-muted)") + "20",
                                color: PRIORITY_COLOR[student.priority] || "var(--text-muted)",
                              }}
                            >
                              {student.priority}
                            </span>
                          </div>

                          {/* Current stage label */}
                          <p
                            className="text-xs mb-2"
                            style={{ color: phase.color, fontWeight: 600 }}
                          >
                            Stage: &ldquo;{PLAIN_LABELS[student.stage] || student.stage}&rdquo;
                          </p>

                          {/* Countries + Level */}
                          {(student.preferredCountries.length > 0 || student.preferredLevel) && (
                            <p className="text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                              {student.preferredCountries.slice(0, 3).map((c) => COUNTRY_FLAGS[c] || c).join(" ")}
                              {student.preferredLevel && (
                                <span className="ml-1">
                                  → {student.preferredLevel.charAt(0) + student.preferredLevel.slice(1).toLowerCase()}
                                  {student.preferredField ? ` in ${student.preferredField}` : ""}
                                </span>
                              )}
                            </p>
                          )}

                          {/* Counselor */}
                          {student.assignedCounselor && (
                            <p className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>
                              Counselor: {student.assignedCounselor.firstName} {student.assignedCounselor.lastName.charAt(0)}.
                            </p>
                          )}

                          {/* Days in stage */}
                          <div className="flex items-center justify-between">
                            <p
                              className="text-[11px]"
                              style={{ color: stuck ? "var(--danger)" : "var(--text-muted)" }}
                            >
                              {stuck && "⚠ "}
                              {stuck ? `Stuck for ${days} days` : `📅 In this step: ${days} day${days !== 1 ? "s" : ""}`}
                            </p>
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: "var(--accent)" }}
                            >
                              Open →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p
                  className="text-sm text-center py-4 rounded-xl"
                  style={{ color: "var(--text-muted)", background: "var(--background)" }}
                >
                  No students in this phase
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Students Needing Attention ── */}
      {stuckStudents.length > 0 && (
        <div className="card p-5" style={{ borderTop: "3px solid var(--danger)" }}>
          <h2 className="font-bold text-base mb-1" style={{ color: "var(--danger)" }}>
            ⚠ Students Needing Attention
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            These students have been in the same step for more than 14 days
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stuckStudents.map((student) => {
              const days = daysInStage(student.updatedAt);
              const phase = PHASES.find((p) => p.stages.includes(student.stage));
              return (
                <Link key={student.id} href={`/students/${student.id}`}>
                  <div
                    className="p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer"
                    style={{
                      background: "var(--background)",
                      borderColor: "var(--danger)",
                    }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "var(--danger)" }}
                      >
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          {student.referenceNumber}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      {phase?.emoji} {phase?.name} · &ldquo;{PLAIN_LABELS[student.stage] || student.stage}&rdquo;
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "var(--danger)" }}>
                      ⚠ Stuck for {days} days
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {visaPendingCount}
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
            Visa Pending
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Visa applied, awaiting decision
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>
            {offerReceivedCount}
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
            With University Offer
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Awaiting acceptance decision
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>
            {onHoldCount}
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
            On Hold
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Paused, not actively progressing
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>
            {withdrawnThisMonthCount}
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
            Withdrawn This Month
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Students who left this month
          </p>
        </div>
      </div>
    </div>
  );
}

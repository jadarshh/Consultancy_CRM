import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MessageSquare, MapPin, Flag, Edit, GraduationCap } from "lucide-react";
import CommunicationSection from "@/components/students/CommunicationSection";
import CoursesSection from "@/components/students/CoursesSection";
import FamilySection from "@/components/students/FamilySection";
import { StageChangeButton } from "@/components/students/StageChangeButton";
import DocumentsSection from "@/components/students/DocumentsSection";
import PhotoUpload from "@/components/students/PhotoUpload";
import {
  STAGE_LABELS, STAGE_COLORS, formatDate, formatCurrency, snakeToTitle, timeAgo
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  CA: "🇨🇦", GB: "🇬🇧", AU: "🇦🇺", US: "🇺🇸", DE: "🇩🇪",
  NZ: "🇳🇿", IE: "🇮🇪", NL: "🇳🇱", FR: "🇫🇷", IN: "🇮🇳",
};

const DOC_STATUS_STYLE: Record<string, { bg: string; color: string; icon: string; border: string }> = {
  VERIFIED:       { bg: "var(--success-bg)", color: "var(--success)", icon: "✓", border: "var(--success)" },
  PENDING_REVIEW: { bg: "var(--warning-bg)", color: "var(--warning)", icon: "⏳", border: "var(--warning)" },
  REJECTED:       { bg: "var(--danger-bg)", color: "var(--danger)", icon: "✗", border: "var(--danger)" },
  EXPIRED:        { bg: "#F8FAFC", color: "var(--text-muted)", icon: "⚠", border: "var(--text-muted)" },
};

const COMM_ICONS: Record<string, string> = {
  PHONE_CALL: "📞", WHATSAPP: "💬", EMAIL: "✉️", SMS: "📱",
  IN_PERSON: "🤝", VIDEO_CALL: "📹", OTHER: "💬",
};

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      assignedCounselor: { select: { firstName: true, lastName: true, email: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      academicRecords: { orderBy: { createdAt: "desc" } },
      testScores: { orderBy: { testDate: "desc" } },
      workExperiences: { orderBy: { startDate: "desc" } },
      familyMembers: true,
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { firstName: true } } },
      },
      communicationLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { loggedBy: { select: { firstName: true, lastName: true } } },
      },
      studentNotes: {
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          program: {
            include: { university: { include: { country: true } } },
          },
          intake: true,
        },
      },
      tasks: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!student) notFound();

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "personal", label: "Personal" },
    { key: "academic", label: "Academic" },
    { key: "documents", label: `Docs (${student.documents.length})` },
    { key: "courses", label: "Courses" },
    { key: "applications", label: `Applications (${student.applications.length})` },
    { key: "communications", label: "Communications" },
    { key: "notes", label: `Notes (${student.studentNotes.length})` },
  ];

  const stageColor = STAGE_COLORS[student.stage] || "badge-neutral";

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      {/* Back */}
      <Link
        href="/students"
        className="inline-flex items-center gap-1.5 text-sm hover:underline"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Student Header Card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          {/* Avatar */}
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={`${student.firstName} ${student.lastName}`}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: "var(--primary)" }}
            >
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {student.firstName} {student.middleName ? student.middleName + " " : ""}{student.lastName}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--primary-50)", color: "var(--primary)" }}>
                {student.referenceNumber}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {student.email && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <Mail className="w-3.5 h-3.5" /> {student.email}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Phone className="w-3.5 h-3.5" /> {student.phonePrimary}
              </span>
              {student.whatsappNumber && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <MessageSquare className="w-3.5 h-3.5" /> {student.whatsappNumber}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`badge ${stageColor}`}>
                {STAGE_LABELS[student.stage] || student.stage}
              </span>
              <StageChangeButton
                studentId={student.id}
                currentStage={student.stage}
                userRole={session?.user.role || ""}
              />
              <span className={`badge priority-${student.priority.toLowerCase()}`}>
                {student.priority} Priority
              </span>
              {student.preferredCountries.map((c) => (
                <span key={c} className="text-xl" title={c}>{COUNTRY_FLAGS[c] || c}</span>
              ))}
              {student.preferredLevel && (
                <span className="badge badge-neutral">{student.preferredLevel}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Counselor: </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {student.assignedCounselor
                    ? `${student.assignedCounselor.firstName} ${student.assignedCounselor.lastName}`
                    : "Unassigned"}
                </span>
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Source: </span>
                <span style={{ color: "var(--text-secondary)" }}>{snakeToTitle(student.source)}</span>
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Added: </span>
                <span style={{ color: "var(--text-secondary)" }}>{formatDate(student.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/students/${id}?tab=communications`} className="btn btn-secondary text-sm">
              <MessageSquare className="w-4 h-4" /> Log Comm
            </Link>
            <Link href={`/students/${id}/edit`} className="btn btn-secondary text-sm">
              <Edit className="w-4 h-4" /> Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/students/${id}?tab=${key}`}
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style={
                tab === key
                  ? { borderColor: "var(--primary)", color: "var(--primary)" }
                  : { borderColor: "transparent", color: "var(--text-secondary)" }
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">

        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Latest Academic */}
              {student.academicRecords.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <GraduationCap className="w-4 h-4" /> Education
                  </h3>
                  <div className="space-y-3">
                    {student.academicRecords.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {snakeToTitle(r.level)} — {r.institution}
                          </p>
                          {r.fieldOfStudy && (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.fieldOfStudy}</p>
                          )}
                        </div>
                        {r.gradeValue && (
                          <span className="badge badge-info text-xs">
                            {r.gradeValue}{r.maxGrade ? ` / ${r.maxGrade}` : ""}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Scores */}
              {student.testScores.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Test Scores</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {student.testScores.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl text-center"
                        style={{ background: "var(--primary-50)" }}
                      >
                        <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{t.testType}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: "var(--primary)" }}>{t.overallScore}</p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                          {formatDate(t.testDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Communications */}
              {student.communicationLogs.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</h3>
                    <Link href={`/students/${id}?tab=communications`} className="text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
                      Log New →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {student.communicationLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">{COMM_ICONS[log.type] || "💬"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {log.subject || snakeToTitle(log.type)}
                          </p>
                          <p className="text-xs mt-0.5 truncate-2" style={{ color: "var(--text-secondary)" }}>
                            {log.summary}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            by {log.loggedBy.firstName} · {timeAgo(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Info */}
            <div className="space-y-5">
              {/* Financial */}
              {student.fundingSource && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Financial</h3>
                  <div className="space-y-2">
                    <InfoRow label="Funding" value={snakeToTitle(student.fundingSource)} />
                    {student.annualFamilyIncome && (
                      <InfoRow
                        label="Family Income"
                        value={formatCurrency(Number(student.annualFamilyIncome), student.incomeCurrency)}
                      />
                    )}
                    {student.bankBalance && (
                      <InfoRow
                        label="Bank Balance"
                        value={formatCurrency(Number(student.bankBalance), student.incomeCurrency)}
                      />
                    )}
                    {student.budgetMin && student.budgetMax && (
                      <InfoRow
                        label="Budget"
                        value={`${formatCurrency(Number(student.budgetMin))} – ${formatCurrency(Number(student.budgetMax))}`}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Passport */}
              {student.passportNumber && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Flag className="w-4 h-4" /> Passport
                  </h3>
                  <div className="space-y-2">
                    <InfoRow label="Number" value={student.passportNumber} />
                    <InfoRow label="Expiry" value={formatDate(student.passportExpiryDate)} />
                    {student.visaRefusalHistory && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg" style={{ background: "var(--danger-bg)" }}>
                        <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>
                          ⚠ Has visa refusal history
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {student.tasks.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Open Tasks</h3>
                  <div className="space-y-2">
                    {student.tasks.slice(0, 3).map((task) => {
                      const overdue = new Date(task.dueDate) < new Date();
                      return (
                        <div key={task.id} className="text-sm">
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                          <p
                            className={`text-xs mt-0.5 ${overdue ? "text-red-500" : ""}`}
                            style={!overdue ? { color: "var(--text-muted)" } : undefined}
                          >
                            {overdue ? "⚠ " : ""}Due {formatDate(task.dueDate)} · {task.assignedTo.firstName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Personal Tab ──────────────────────────────────────────────────── */}
        {tab === "personal" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <InfoCard title="Personal Information">
              <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
              <InfoRow label="Gender" value={student.gender} />
              <InfoRow label="Nationality" value={student.nationality} />
              <InfoRow label="Marital Status" value={student.maritalStatus} />
              <InfoRow label="Religion" value={student.religion} />
              <InfoRow label="Native Language" value={student.nativeLanguage} />
            </InfoCard>
            <InfoCard title="Current Address">
              <InfoRow label="Address" value={student.currentAddress} />
              <InfoRow label="City" value={student.currentCity} />
              <InfoRow label="State" value={student.currentState} />
              <InfoRow label="Country" value={student.currentCountry} />
              <InfoRow label="Postal Code" value={student.currentPostalCode} />
            </InfoCard>
            <InfoCard title="Emergency Contact">
              <InfoRow label="Name" value={student.emergencyName} />
              <InfoRow label="Phone" value={student.emergencyPhone} />
              <InfoRow label="Relationship" value={student.emergencyRelationship} />
            </InfoCard>
            <div className="lg:col-span-2">
              <div className="card p-5">
                <FamilySection studentId={id} />
              </div>
            </div>
          </div>
        )}

        {/* ── Academic Tab ─────────────────────────────────────────────────── */}
        {tab === "academic" && (
          <div className="space-y-5">
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Academic History</h3>
              </div>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Level</th><th>Institution</th><th>Field</th>
                    <th>Grade</th><th>Backlogs</th><th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {student.academicRecords.map((r) => (
                    <tr key={r.id}>
                      <td><span className="badge badge-neutral">{snakeToTitle(r.level)}</span></td>
                      <td>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.institution}</p>
                        {r.boardUniversity && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.boardUniversity}</p>}
                      </td>
                      <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.fieldOfStudy || "—"}</td>
                      <td>
                        {r.gradeValue ? (
                          <span className="badge badge-info">
                            {r.gradeType && snakeToTitle(r.gradeType)}: {r.gradeValue}
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        {r.backlogs > 0 ? (
                          <span className="badge badge-warning">{r.backlogs}</span>
                        ) : <span className="badge badge-success">0</span>}
                      </td>
                      <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {r.endDate ? formatDate(r.endDate, "MMM yyyy") : r.isCompleted ? "Completed" : "Ongoing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {student.academicRecords.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No academic records added</p>
              )}
            </div>

            {/* Test Scores */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Test Scores</h3>
              </div>
              <table className="table-base">
                <thead>
                  <tr><th>Test</th><th>Overall</th><th>Sub-scores</th><th>Date</th><th>Expiry</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {student.testScores.map((t) => {
                    const subs = t.subScores as Record<string, number> | null;
                    return (
                      <tr key={t.id}>
                        <td><span className="badge badge-primary">{t.testType}</span></td>
                        <td className="text-lg font-bold" style={{ color: "var(--primary)" }}>{t.overallScore}</td>
                        <td>
                          {subs ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(subs).map(([k, v]) => (
                                <span key={k} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--primary-50)", color: "var(--primary)" }}>
                                  {k[0].toUpperCase()}: {v}
                                </span>
                              ))}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(t.testDate)}</td>
                        <td className="text-sm" style={{ color: t.expiryDate && new Date(t.expiryDate) < new Date() ? "var(--danger)" : "var(--text-secondary)" }}>
                          {formatDate(t.expiryDate)}
                        </td>
                        <td>
                          {t.isVerified
                            ? <span className="badge badge-success">Verified</span>
                            : <span className="badge badge-warning">Unverified</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {student.testScores.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No test scores added</p>
              )}
            </div>
          </div>
        )}

        {/* ── Documents Tab ─────────────────────────────────────────────────── */}
        {tab === "documents" && (
          <DocumentsSection studentId={student.id} />
        )}

        {/* ── Applications Tab ──────────────────────────────────────────────── */}
        {tab === "applications" && (
          <div className="space-y-4">
            {student.applications.map((app) => (
              <div key={app.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {app.program.name}
                      </p>
                      <span className="badge badge-neutral text-[10px]">{app.applicationNumber}</span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {app.program.university.name} · {app.program.university.country.name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="badge badge-neutral">{snakeToTitle(app.program.level)}</span>
                      {app.intake && <span className="badge badge-info">{app.intake.name}</span>}
                      <span className="badge badge-neutral">
                        {formatCurrency(Number(app.program.tuitionFee), app.program.feeCurrency)}/yr
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="badge badge-primary">{snakeToTitle(app.status)}</span>
                    {app.offerDeadline && (
                      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                        Deadline: {formatDate(app.offerDeadline)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {student.applications.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No applications yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── Courses Tab ────────────────────────────────────────────────────── */}
        {tab === "courses" && (
          <CoursesSection studentId={student.id} />
        )}

        {/* ── Communications Tab ─────────────────────────────────────────────── */}
        {tab === "communications" && (
          <CommunicationSection studentId={student.id} />
        )}

        {/* ── Notes Tab ─────────────────────────────────────────────────────── */}
        {tab === "notes" && (
          <div className="space-y-3">
            {student.studentNotes.map((note) => (
              <div
                key={note.id}
                className="card p-5"
                style={note.isPinned ? { borderLeft: "3px solid var(--accent)" } : undefined}
              >
                {note.isPinned && (
                  <span className="badge badge-info text-[10px] mb-2">📌 Pinned</span>
                )}
                <p className="text-sm" style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                  {note.content}
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {note.createdBy.firstName} {note.createdBy.lastName} · {formatDate(note.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            ))}
            {student.studentNotes.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No notes added</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────────

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm flex-shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

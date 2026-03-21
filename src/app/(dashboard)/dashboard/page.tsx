import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Users,
  FileText,
  CheckSquare,
  Phone,
  Clock,
  TrendingUp,
  Plane,
  Award,
  BookOpen,
  Trophy,
} from "lucide-react";
import { StatCard } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { STAGE_LABELS, STAGE_COLORS, formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

// All known course types — always show every one, even with 0 enrollments
const ALL_COURSE_TYPES = [
  "IELTS_PREP",
  "TOEFL_PREP",
  "PTE_PREP",
  "DUOLINGO_PREP",
  "GRE_PREP",
  "GMAT_PREP",
  "SAT_PREP",
  "ACT_PREP",
  "ENGLISH_LANGUAGE",
  "FOUNDATION_PROGRAM",
  "OTHER",
] as const;

const COURSE_TYPE_LABELS: Record<string, string> = {
  IELTS_PREP: "IELTS Prep",
  TOEFL_PREP: "TOEFL Prep",
  PTE_PREP: "PTE Prep",
  DUOLINGO_PREP: "Duolingo Prep",
  GRE_PREP: "GRE Prep",
  GMAT_PREP: "GMAT Prep",
  SAT_PREP: "SAT Prep",
  ACT_PREP: "ACT Prep",
  ENGLISH_LANGUAGE: "English Language",
  FOUNDATION_PROGRAM: "Foundation",
  OTHER: "Other",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  APPLICATION: "Application",
  TASK: "Task",
  COMMUNICATION: "Communication",
  DOCUMENT: "Document",
  NOTE: "Note",
  COURSE: "Course",
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-400",
};

async function getDashboardData(userId: string, role: string) {
  const isAll = role === "ADMIN" || role === "MANAGER";
  const whereStudent = isAll ? {} : { assignedCounselorId: userId };

  const [
    totalStudents,
    activeApplications,
    pendingTasks,
    todayFollowUps,
    pipelineStats,
    recentActivity,
    upcomingFollowUps,
    myTasks,
    visaPendingCount,
    applicationPhaseCount,
    visaApprovedCount,
    enrolledCount,
    courseEnrolled,
    courseNeeds,
  ] = await Promise.all([
    prisma.student.count({ where: { ...whereStudent, isActive: true } }),
    prisma.application.count({
      where: {
        student: whereStudent,
        status: { notIn: ["ENROLLED", "WITHDRAWN", "REJECTED", "VISA_REFUSED"] },
      },
    }),
    prisma.task.count({
      where: { assignedToId: userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.communicationLog.count({
      where: {
        followUpDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        ...(isAll ? {} : { loggedById: userId }),
      },
    }),
    prisma.student.groupBy({
      by: ["stage"],
      where: {
        ...whereStudent,
        isActive: true,
        stage: { notIn: ["ON_HOLD", "WITHDRAWN", "VISA_REFUSED", "NOT_QUALIFIED"] },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.activityLog.findMany({
      where: isAll ? {} : { performedById: userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { performedBy: { select: { firstName: true, lastName: true } } },
    }),
    prisma.communicationLog.findMany({
      where: {
        followUpDate: { gte: new Date() },
        ...(isAll ? {} : { loggedById: userId }),
      },
      take: 5,
      orderBy: { followUpDate: "asc" },
      include: { student: { select: { firstName: true, lastName: true, id: true } } },
    }),
    prisma.task.findMany({
      where: { assignedToId: userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      take: 5,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      include: { student: { select: { firstName: true, lastName: true, id: true } } },
    }),
    // Visa Pending
    prisma.student.count({
      where: { ...whereStudent, isActive: true, stage: "VISA_APPLIED" as never },
    }),
    // Application Phase
    prisma.student.count({
      where: {
        ...whereStudent,
        isActive: true,
        stage: { in: ["APPLICATION_PREP", "APPLICATIONS_SUBMITTED", "OFFER_RECEIVED"] as never[] },
      },
    }),
    // Visa Approved
    prisma.student.count({
      where: { ...whereStudent, isActive: true, stage: "VISA_APPROVED" as never },
    }),
    // Enrolled
    prisma.student.count({
      where: { ...whereStudent, isActive: true, stage: "ENROLLED" as never },
    }),
    // Course enrollments by type — ENROLLED status
    prisma.studentCourse.groupBy({
      by: ["courseType"],
      where: { status: "ENROLLED", student: { ...whereStudent, isActive: true } },
      _count: { id: true },
    }),
    // Course needs — NEEDS_ENROLLMENT status
    prisma.studentCourse.groupBy({
      by: ["courseType"],
      where: { status: "NEEDS", student: { ...whereStudent, isActive: true } },
      _count: { id: true },
    }),
  ]);

  // Build merged course map: courseType -> { enrolled, needs }
  const courseMap: Record<string, { enrolled: number; needs: number }> = {};
  for (const row of courseEnrolled) {
    if (!courseMap[row.courseType]) courseMap[row.courseType] = { enrolled: 0, needs: 0 };
    courseMap[row.courseType].enrolled = row._count.id;
  }
  for (const row of courseNeeds) {
    if (!courseMap[row.courseType]) courseMap[row.courseType] = { enrolled: 0, needs: 0 };
    courseMap[row.courseType].needs = row._count.id;
  }

  // Counselor leaderboard — only for ADMIN / MANAGER
  let leaderboard: { id: string; name: string; count: number }[] = [];
  if (isAll) {
    const grouped = await prisma.student.groupBy({
      by: ["assignedCounselorId"],
      where: { isActive: true, assignedCounselorId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });
    const counselorIds = grouped
      .map((g) => g.assignedCounselorId)
      .filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: counselorIds }, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    leaderboard = grouped
      .filter((g) => g.assignedCounselorId && userMap[g.assignedCounselorId!])
      .map((g) => ({
        id: g.assignedCounselorId!,
        name: `${userMap[g.assignedCounselorId!].firstName} ${userMap[g.assignedCounselorId!].lastName}`,
        count: g._count.id,
      }));
  }

  const totalPipelineStudents = pipelineStats.reduce((sum, s) => sum + s._count.id, 0);

  return {
    totalStudents,
    activeApplications,
    pendingTasks,
    todayFollowUps,
    pipelineStats,
    recentActivity,
    upcomingFollowUps,
    myTasks,
    visaPendingCount,
    applicationPhaseCount,
    visaApprovedCount,
    enrolledCount,
    courseMap,
    leaderboard,
    isAll,
    totalPipelineStudents,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const sp = await searchParams;

  const role = session.user.role as string;
  const data = await getDashboardData(session.user.id, role);
  const firstName = session.user.name?.split(" ")[0] || "there";
  const today = format(new Date(), "EEEE, MMMM do");

  const maxStageCount = Math.max(...data.pipelineStats.map((s) => s._count.id), 1);

  const roleLabel =
    role === "ADMIN"
      ? "Admin"
      : role === "MANAGER"
      ? "Manager"
      : role === "COUNSELOR"
      ? "Counselor"
      : role;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Access denied banner */}
      {sp?.error === "access_denied" && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          You don&apos;t have permission to access that page.
        </div>
      )}

      {/* Hero Greeting */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #2A5298 50%, var(--accent) 100%)",
          color: "white",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -bottom-8 right-16 w-28 h-28 rounded-full opacity-10" style={{ background: "white" }} />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                Good morning, {firstName} 👋
              </h1>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
              >
                {roleLabel}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
              {today} — Here&apos;s your overview for today
            </p>
          </div>
          {/* Mini stats row inside hero */}
          <div className="flex gap-6">
            {[
              { label: "Students", value: data.totalStudents },
              { label: "Follow-ups", value: data.todayFollowUps },
              { label: "Tasks", value: data.pendingTasks },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions pill row */}
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Quick Actions</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/students/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <Users className="w-3.5 h-3.5" />
          Add Student
        </Link>
        <Link
          href="/communication/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Phone className="w-3.5 h-3.5" />
          Log Communication
        </Link>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: "var(--success)", color: "#fff" }}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Add Task
        </Link>
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{
            background: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: "var(--border)",
          }}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          View Pipeline
        </Link>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={data.totalStudents.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          label="Active Applications"
          value={data.activeApplications.toLocaleString()}
          icon={<FileText className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          label="Pending Tasks"
          value={data.pendingTasks.toLocaleString()}
          icon={<CheckSquare className="w-5 h-5" />}
          color={data.pendingTasks > 10 ? "warning" : "primary"}
        />
        <StatCard
          label="Today's Follow-ups"
          value={data.todayFollowUps.toLocaleString()}
          icon={<Phone className="w-5 h-5" />}
          color={data.todayFollowUps > 0 ? "warning" : "primary"}
        />
      </div>

      {/* Stat Cards Row 2 — Journey Stage */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Visa Pending"
          value={data.visaPendingCount.toLocaleString()}
          icon={<Plane className="w-5 h-5" />}
          color={data.visaPendingCount > 0 ? "warning" : "primary"}
        />
        <StatCard
          label="Application Phase"
          value={data.applicationPhaseCount.toLocaleString()}
          icon={<TrendingUp className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          label="Visa Approved"
          value={data.visaApprovedCount.toLocaleString()}
          icon={<Award className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          label="Enrolled"
          value={data.enrolledCount.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          color="success"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ background: "var(--accent)" }} />
                <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Pipeline Overview</h2>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {data.totalPipelineStudents > 0
                  ? `${data.totalPipelineStudents} active student${data.totalPipelineStudents !== 1 ? "s" : ""} across pipeline`
                  : "No active students in pipeline"}
              </p>
            </div>
            <Link
              href="/pipeline"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--accent)" }}
            >
              View Board →
            </Link>
          </div>

          <div className="space-y-3 mt-5">
            {data.pipelineStats.map(({ stage, _count }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <span className={`badge ${STAGE_COLORS[stage] || "badge-neutral"} text-[10px]`}>
                    {STAGE_LABELS[stage] || stage}
                  </span>
                </div>
                <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(_count.id / maxStageCount) * 100}%`,
                      background: "linear-gradient(90deg, var(--primary), var(--accent))",
                    }}
                  />
                </div>
                <span
                  className="text-sm font-semibold w-6 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {_count.id}
                </span>
              </div>
            ))}
            {data.pipelineStats.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
                No active students yet.{" "}
                <Link href="/students/new" className="underline" style={{ color: "var(--accent)" }}>
                  Add one →
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: "var(--accent)" }} />
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>My Tasks</h2>
            </div>
            <Link
              href="/tasks"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--accent)" }}
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {data.myTasks.map((task) => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "var(--background)" }}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {task.title}
                    </p>
                    {task.student && (
                      <Link
                        href={`/students/${task.student.id}`}
                        className="text-xs hover:underline"
                        style={{ color: "var(--accent)" }}
                      >
                        {task.student.firstName} {task.student.lastName}
                      </Link>
                    )}
                    <p
                      className={`text-xs mt-1 ${overdue ? "text-red-500 font-medium" : ""}`}
                      style={!overdue ? { color: "var(--text-muted)" } : undefined}
                    >
                      {overdue ? "⚠ " : ""}Due {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              );
            })}
            {data.myTasks.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                No pending tasks
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid — Recent Activity + Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: "var(--accent)" }} />
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {data.recentActivity.map((log) => {
              const entityLabel =
                ENTITY_TYPE_LABELS[log.entityType] || log.entityType;
              const entityPath =
                log.entityType === "STUDENT"
                  ? `/students/${log.entityId}`
                  : log.entityType === "APPLICATION"
                  ? `/applications/${log.entityId}`
                  : log.entityType === "TASK"
                  ? `/tasks/${log.entityId}`
                  : null;

              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {log.performedBy.firstName} {log.performedBy.lastName}
                      </span>{" "}
                      {log.action.toLowerCase().replace(/_/g, " ")} —{" "}
                      {entityPath ? (
                        <Link
                          href={entityPath}
                          className="hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          {entityLabel}
                        </Link>
                      ) : (
                        <span>{entityLabel}</span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(log.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            {data.recentActivity.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: "var(--accent)" }} />
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Upcoming Follow-ups</h2>
            </div>
            <Link
              href="/communication"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--accent)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {data.upcomingFollowUps.map((log) => (
              <Link
                key={log.id}
                href={`/students/${log.student.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background)] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {log.student.firstName.charAt(0)}
                  {log.student.lastName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {log.student.firstName} {log.student.lastName}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {log.type.replace("_", " ")} · {formatDate(log.followUpDate!, "MMM d, h:mm a")}
                  </p>
                </div>
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}
            {data.upcomingFollowUps.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                No upcoming follow-ups
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Course Enrollments — always shown */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 rounded-full" style={{ background: "var(--accent)" }} />
          <BookOpen className="w-5 h-5" style={{ color: "var(--primary)" }} />
          <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Course Enrollments</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Students enrolled or needing enrollment in prep courses
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ALL_COURSE_TYPES.map((courseType) => {
            const counts = data.courseMap[courseType] ?? { enrolled: 0, needs: 0 };
            return (
              <div
                key={courseType}
                className="text-center p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default"
                style={{
                  background: counts.enrolled > 0
                    ? "linear-gradient(135deg, var(--primary-50), var(--primary-100))"
                    : "var(--background)",
                  borderColor: counts.enrolled > 0 ? "var(--primary-100)" : "var(--border)",
                }}
              >
                <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                  {counts.enrolled}
                </p>
                <p className="text-[11px] mt-0.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {COURSE_TYPE_LABELS[courseType] || courseType}
                </p>
                {counts.needs > 0 && (
                  <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--warning)" }}>
                    {counts.needs} pending
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Counselor Leaderboard — ADMIN / MANAGER only */}
      {data.isAll && data.leaderboard.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5" style={{ color: "var(--warning)" }} />
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              Counselor Leaderboard
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Top counselors by active student count
          </p>
          <div className="space-y-3">
            {data.leaderboard.map((entry, idx) => {
              const maxCount = data.leaderboard[0]?.count || 1;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center flex-shrink-0">
                    {medals[idx] ?? `${idx + 1}.`}
                  </span>
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {entry.name}
                    </p>
                  </div>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(entry.count / maxCount) * 100}%`,
                        background: idx === 0 ? "var(--warning)" : "var(--primary)",
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-semibold w-8 text-right flex-shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {entry.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

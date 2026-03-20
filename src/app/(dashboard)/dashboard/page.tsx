import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Users, FileText, CheckSquare, Phone, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { STAGE_LABELS, STAGE_COLORS, formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
      where: { ...whereStudent, isActive: true, stage: { notIn: ["ON_HOLD", "WITHDRAWN", "VISA_REFUSED", "NOT_QUALIFIED"] } },
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
  ]);

  return {
    totalStudents,
    activeApplications,
    pendingTasks,
    todayFollowUps,
    pipelineStats,
    recentActivity,
    upcomingFollowUps,
    myTasks,
  };
}

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-400",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const data = await getDashboardData(session.user.id, session.user.role);
  const firstName = session.user.name?.split(" ")[0] || "there";
  const today = format(new Date(), "EEEE, MMMM do");

  const maxStageCount = Math.max(...data.pipelineStats.map((s) => s._count.id), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Good morning, {firstName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {today}
          </p>
        </div>
        <Link href="/students/new" className="btn btn-primary">
          + Add Student
        </Link>
      </div>

      {/* Stat Cards */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Pipeline Overview
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Active students by stage
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

          <div className="space-y-3">
            {data.pipelineStats.map(({ stage, _count }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <span
                    className={`badge ${STAGE_COLORS[stage] || "badge-neutral"} text-[10px]`}
                  >
                    {STAGE_LABELS[stage] || stage}
                  </span>
                </div>
                <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(_count.id / maxStageCount) * 100}%`,
                      background: "var(--primary)",
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
                No active students yet. <Link href="/students/new" className="underline" style={{ color: "var(--accent)" }}>Add one →</Link>
              </p>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              My Tasks
            </h2>
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
              const overdue = new Date(task.dueDate) < new Date();
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
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {task.student.firstName} {task.student.lastName}
                      </p>
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

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {data.recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {log.performedBy.firstName}
                    </span>{" "}
                    {log.action.toLowerCase().replace(/_/g, " ")} — {log.entityType}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
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
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              Upcoming Follow-ups
            </h2>
            <Link href="/communication" className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
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
                  {log.student.firstName.charAt(0)}{log.student.lastName.charAt(0)}
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
    </div>
  );
}

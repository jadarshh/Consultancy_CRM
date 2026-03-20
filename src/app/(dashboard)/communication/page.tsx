import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Clock, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<string, string> = {
  PHONE_CALL: "📞",
  WHATSAPP: "💬",
  EMAIL: "📧",
  SMS: "📱",
  IN_PERSON: "🤝",
  VIDEO_CALL: "📹",
  OTHER: "💬",
};

function snakeToTitle(str: string): string {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(str: string, len = 80): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export default async function CommunicationPage() {
  const session = await auth();
  if (!session) return null;

  const now = new Date();

  // End of today (midnight tonight)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // End of this week (Sunday midnight)
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  // Fetch all communication logs that have a follow-up date
  const allFollowUps = await prisma.communicationLog.findMany({
    where: {
      followUpDate: { not: null },
    },
    orderBy: { followUpDate: "asc" },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          referenceNumber: true,
        },
      },
      loggedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  // Separate into groups
  const overdue = allFollowUps.filter(
    (l) => l.followUpDate !== null && new Date(l.followUpDate) < now
  );
  const dueToday = allFollowUps.filter(
    (l) =>
      l.followUpDate !== null &&
      new Date(l.followUpDate) >= now &&
      new Date(l.followUpDate) <= endOfToday
  );
  const dueThisWeek = allFollowUps.filter(
    (l) =>
      l.followUpDate !== null &&
      new Date(l.followUpDate) > endOfToday &&
      new Date(l.followUpDate) <= endOfWeek
  );
  const later = allFollowUps.filter(
    (l) =>
      l.followUpDate !== null && new Date(l.followUpDate) > endOfWeek
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Follow-up Queue
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Upcoming and overdue follow-ups from communication logs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--danger-bg)" }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--danger)" }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>
              {overdue.length}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Overdue</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--warning-bg)" }}
          >
            <Clock className="w-5 h-5" style={{ color: "var(--warning)" }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>
              {dueToday.length}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Due Today</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--info-bg)" }}
          >
            <Calendar className="w-5 h-5" style={{ color: "var(--info)" }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--info)" }}>
              {dueThisWeek.length}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>This Week</p>
          </div>
        </div>
      </div>

      {allFollowUps.length === 0 && (
        <div className="card p-12 text-center">
          <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--success)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            All caught up!
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            No follow-ups scheduled. Log communications with students to schedule follow-ups.
          </p>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: "var(--danger)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--danger)" }}>
              Overdue ({overdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {overdue.map((log) => (
              <FollowUpCard key={log.id} log={log} variant="overdue" />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      {dueToday.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--warning)" }}>
              Today ({dueToday.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueToday.map((log) => (
              <FollowUpCard key={log.id} log={log} variant="today" />
            ))}
          </div>
        </section>
      )}

      {/* This Week */}
      {dueThisWeek.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" style={{ color: "var(--info)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--info)" }}>
              This Week ({dueThisWeek.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueThisWeek.map((log) => (
              <FollowUpCard key={log.id} log={log} variant="week" />
            ))}
          </div>
        </section>
      )}

      {/* Later */}
      {later.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
              Later ({later.length})
            </h2>
          </div>
          <div className="space-y-3">
            {later.map((log) => (
              <FollowUpCard key={log.id} log={log} variant="later" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Follow-up Card ────────────────────────────────────────────────────────────

type LogWithStudent = Awaited<
  ReturnType<typeof prisma.communicationLog.findMany>
>[number] & {
  student: { id: string; firstName: string; lastName: string; referenceNumber: string };
  loggedBy: { firstName: string; lastName: string };
};

type Variant = "overdue" | "today" | "week" | "later";

const VARIANT_BORDER: Record<Variant, string> = {
  overdue: "var(--danger)",
  today: "var(--warning)",
  week: "var(--info)",
  later: "var(--border-strong)",
};

function FollowUpCard({ log, variant }: { log: LogWithStudent; variant: Variant }) {
  const borderColor = VARIANT_BORDER[variant];
  const icon = TYPE_ICONS[log.type] || "💬";

  return (
    <div
      className="card p-4"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>

        <div className="flex-1 min-w-0">
          {/* Student name link + type */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link
              href={`/students/${log.student.id}?tab=communications`}
              className="font-semibold text-sm hover:underline"
              style={{ color: "var(--primary)" }}
            >
              {log.student.firstName} {log.student.lastName}
            </Link>
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: "var(--primary-50)", color: "var(--primary)" }}
            >
              {log.student.referenceNumber}
            </span>
            <span className="badge badge-neutral text-[10px]">{snakeToTitle(log.type)}</span>
          </div>

          {/* Subject */}
          {log.subject && (
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              {log.subject}
            </p>
          )}

          {/* Summary preview */}
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {truncate(log.summary)}
          </p>

          {/* Follow-up date */}
          <div className="flex items-center gap-1 mt-2">
            <Clock
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{
                color:
                  variant === "overdue"
                    ? "var(--danger)"
                    : variant === "today"
                    ? "var(--warning)"
                    : "var(--text-muted)",
              }}
            />
            <span
              className="text-xs font-medium"
              style={{
                color:
                  variant === "overdue"
                    ? "var(--danger)"
                    : variant === "today"
                    ? "var(--warning)"
                    : "var(--text-muted)",
              }}
            >
              {variant === "overdue" ? "Was due: " : "Follow up: "}
              {formatDate(log.followUpDate)}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
              Logged by {log.loggedBy.firstName} {log.loggedBy.lastName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

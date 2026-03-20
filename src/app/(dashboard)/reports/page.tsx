import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  NEW_INQUIRY: "New Inquiry",
  INITIAL_CONSULTATION: "Initial Consultation",
  PROFILE_ASSESSMENT: "Profile Assessment",
  COUNTRY_SHORTLISTED: "Country Shortlisted",
  DOCUMENTS_COLLECTION: "Documents Collection",
  APPLICATION_PREP: "Application Prep",
  APPLICATIONS_SUBMITTED: "Applications Submitted",
  OFFER_RECEIVED: "Offer Received",
  OFFER_ACCEPTED: "Offer Accepted",
  TUITION_DEPOSITED: "Tuition Deposited",
  VISA_DOCUMENTS_PREP: "Visa Docs Prep",
  VISA_APPLIED: "Visa Applied",
  VISA_APPROVED: "Visa Approved",
  PRE_DEPARTURE: "Pre-Departure",
  DEPARTED: "Departed",
  ENROLLED: "Enrolled",
  ON_HOLD: "On Hold",
  WITHDRAWN: "Withdrawn",
  VISA_REFUSED: "Visa Refused",
  NOT_QUALIFIED: "Not Qualified",
};

const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: "Walk-in",
  PHONE: "Phone",
  WEBSITE: "Website",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  EVENT: "Event",
  AGENT: "Agent",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  DOCUMENTS_PENDING: "Documents Pending",
  READY_TO_SUBMIT: "Ready to Submit",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CONDITIONAL_OFFER: "Conditional Offer",
  UNCONDITIONAL_OFFER: "Unconditional Offer",
  OFFER_ACCEPTED: "Offer Accepted",
  OFFER_DECLINED: "Offer Declined",
  TUITION_DEPOSIT_PAID: "Tuition Deposit Paid",
  VISA_APPLIED: "Visa Applied",
  VISA_APPROVED: "Visa Approved",
  VISA_REFUSED: "Visa Refused",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
  REJECTED: "Rejected",
};

async function getReportsData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    studentsByStage,
    studentsBySource,
    studentsByCounselor,
    applicationsByStatus,
    recentStudents,
    totalStudents,
    totalApplications,
    visaApproved,
    enrolled,
  ] = await Promise.all([
    prisma.student.groupBy({
      by: ["stage"],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.student.groupBy({
      by: ["source"],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.student.groupBy({
      by: ["assignedCounselorId"],
      where: { isActive: true, assignedCounselorId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.application.groupBy({
      by: ["status"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.student.findMany({
      where: {
        isActive: true,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.application.count(),
    prisma.student.count({ where: { isActive: true, stage: "VISA_APPROVED" } }),
    prisma.student.count({ where: { isActive: true, stage: "ENROLLED" } }),
  ]);

  // Fetch counselor names
  const counselorIds = studentsByCounselor
    .map((s) => s.assignedCounselorId)
    .filter(Boolean) as string[];

  const counselors = await prisma.user.findMany({
    where: { id: { in: counselorIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const counselorMap = Object.fromEntries(
    counselors.map((c) => [c.id, `${c.firstName} ${c.lastName}`])
  );

  // Fetch active apps per counselor
  const counselorApps = await Promise.all(
    counselorIds.map(async (id) => {
      const count = await prisma.application.count({
        where: {
          student: { assignedCounselorId: id },
          status: { notIn: ["ENROLLED", "WITHDRAWN", "REJECTED", "VISA_REFUSED"] },
        },
      });
      return { id, count };
    })
  );

  const counselorAppsMap = Object.fromEntries(
    counselorApps.map((c) => [c.id, c.count])
  );

  // Monthly student counts for last 6 months
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const count = recentStudents.filter(
      (s) => s.createdAt >= start && s.createdAt <= end
    ).length;
    months.push({ label, count });
  }

  // Top countries from preferredCountries (array field)
  const allStudents = await prisma.student.findMany({
    where: { isActive: true, preferredCountries: { isEmpty: false } },
    select: { preferredCountries: true },
  });
  const countryCounts: Record<string, number> = {};
  for (const s of allStudents) {
    for (const c of s.preferredCountries) {
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    }
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const visaApprovedPct =
    totalStudents > 0 ? Math.round((visaApproved / totalStudents) * 100) : 0;

  return {
    studentsByStage,
    studentsBySource,
    studentsByCounselor,
    applicationsByStatus,
    months,
    topCountries,
    totalStudents,
    totalApplications,
    visaApproved,
    visaApprovedPct,
    enrolled,
    counselorMap,
    counselorAppsMap,
  };
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const d = await getReportsData();
  const totalStageCount = d.studentsByStage.reduce((s, x) => s + x._count.id, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Reports & Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Overview of your CRM performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="card p-5"
          style={{ borderLeft: "4px solid var(--primary)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Total Students
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
            {d.totalStudents.toLocaleString()}
          </p>
        </div>
        <div
          className="card p-5"
          style={{ borderLeft: "4px solid var(--accent)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Total Applications
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
            {d.totalApplications.toLocaleString()}
          </p>
        </div>
        <div
          className="card p-5"
          style={{ borderLeft: "4px solid var(--success)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Visa Approved %
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--success)" }}>
            {d.visaApprovedPct}%
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {d.visaApproved} students
          </p>
        </div>
        <div
          className="card p-5"
          style={{ borderLeft: "4px solid var(--warning)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Enrolled
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--warning)" }}>
            {d.enrolled.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Pipeline Funnel
          </h2>
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Stage</th>
                <th className="text-right">Students</th>
                <th className="text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {d.studentsByStage.map(({ stage, _count }) => (
                <tr key={stage}>
                  <td>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {STAGE_LABELS[stage] || stage}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>
                      {_count.id}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {totalStageCount > 0
                        ? `${Math.round((_count.id / totalStageCount) * 100)}%`
                        : "0%"}
                    </span>
                  </td>
                </tr>
              ))}
              {d.studentsByStage.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Source Breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Lead Source Breakdown
          </h2>
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Source</th>
                <th className="text-right">Students</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {d.studentsBySource.map(({ source, _count }) => (
                <tr key={source}>
                  <td>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {SOURCE_LABELS[source] || source}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="font-semibold" style={{ color: "var(--accent)" }}>
                      {_count.id}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {d.totalStudents > 0
                        ? `${Math.round((_count.id / d.totalStudents) * 100)}%`
                        : "0%"}
                    </span>
                  </td>
                </tr>
              ))}
              {d.studentsBySource.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Counselor Performance */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Counselor Performance
          </h2>
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Counselor</th>
                <th className="text-right">Students</th>
                <th className="text-right">Active Apps</th>
              </tr>
            </thead>
            <tbody>
              {d.studentsByCounselor.map(({ assignedCounselorId, _count }) => (
                <tr key={assignedCounselorId}>
                  <td>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {d.counselorMap[assignedCounselorId!] || "Unknown"}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>
                      {_count.id}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-sm" style={{ color: "var(--accent)" }}>
                      {d.counselorAppsMap[assignedCounselorId!] ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
              {d.studentsByCounselor.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                    No counselors assigned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Application Status Summary */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Application Status Summary
          </h2>
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Status</th>
                <th className="text-right">Count</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {d.applicationsByStatus.map(({ status, _count }) => (
                <tr key={status}>
                  <td>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="font-semibold" style={{ color: "var(--accent)" }}>
                      {_count.id}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {d.totalApplications > 0
                        ? `${Math.round((_count.id / d.totalApplications) * 100)}%`
                        : "0%"}
                    </span>
                  </td>
                </tr>
              ))}
              {d.applicationsByStatus.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly New Students */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            New Students — Last 6 Months
          </h2>
          <div className="space-y-3">
            {d.months.map(({ label, count }) => {
              const maxCount = Math.max(...d.months.map((m) => m.count), 1);
              return (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className="text-xs w-12 shrink-0 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </span>
                  <div
                    className="flex-1 h-6 rounded"
                    style={{ background: "var(--border)" }}
                  >
                    <div
                      className="h-6 rounded flex items-center px-2 transition-all"
                      style={{
                        width: count > 0 ? `${Math.max((count / maxCount) * 100, 8)}%` : "0%",
                        background: "var(--primary)",
                      }}
                    >
                      {count > 0 && (
                        <span className="text-white text-xs font-semibold">{count}</span>
                      )}
                    </div>
                  </div>
                  {count === 0 && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>0</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Preferred Countries */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Top Preferred Countries
          </h2>
          {d.topCountries.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
              No country preferences recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {d.topCountries.map(({ name, count }, idx) => {
                const maxCount = d.topCountries[0]?.count || 1;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold w-5 text-right shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className="text-sm w-28 shrink-0 truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {name}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold w-6 text-right shrink-0"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

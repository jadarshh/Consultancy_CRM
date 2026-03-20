import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Search, Plus, Filter } from "lucide-react";
import { STAGE_LABELS, STAGE_COLORS, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  CA: "🇨🇦", GB: "🇬🇧", AU: "🇦🇺", US: "🇺🇸", DE: "🇩🇪",
  NZ: "🇳🇿", IE: "🇮🇪", NL: "🇳🇱", FR: "🇫🇷", IN: "🇮🇳",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const params = await searchParams;
  const q = params.q || "";
  const stage = params.stage || "";
  const page = parseInt(params.page || "1");
  const limit = 20;

  const isAll = session.user.role === "ADMIN" || session.user.role === "MANAGER";

  const where = {
    isActive: true,
    ...(isAll ? {} : { assignedCounselorId: session.user.id }),
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phonePrimary: { contains: q, mode: "insensitive" as const } },
        { referenceNumber: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(stage && { stage: stage as never }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referenceNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phonePrimary: true,
        stage: true,
        priority: true,
        preferredCountries: true,
        createdAt: true,
        assignedCounselor: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Students
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {total.toLocaleString()} total students
          </p>
        </div>
        <Link href="/students/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form method="GET" className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              name="q"
              defaultValue={q}
              className="input-base pl-9"
              placeholder="Search by name, email, phone..."
              style={{ height: "38px" }}
            />
          </div>

          {/* Stage Filter */}
          <select
            name="stage"
            defaultValue={stage}
            className="input-base"
            style={{ width: "auto", height: "38px" }}
          >
            <option value="">All Stages</option>
            {Object.entries(STAGE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <button type="submit" className="btn btn-secondary" style={{ height: "38px" }}>
            <Filter className="w-4 h-4" />
            Filter
          </button>

          {(q || stage) && (
            <Link href="/students" className="btn btn-ghost" style={{ height: "38px" }}>
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                <th>Stage</th>
                <th>Countries</th>
                <th>Counselor</th>
                <th>Priority</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "var(--primary)" }}
                      >
                        {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/students/${s.id}`}
                          className="font-medium hover:underline text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {s.firstName} {s.lastName}
                        </Link>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {s.referenceNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{s.phonePrimary}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.email}</p>
                  </td>
                  <td>
                    <span className={`badge ${STAGE_COLORS[s.stage] || "badge-neutral"} text-[10px]`}>
                      {STAGE_LABELS[s.stage] || s.stage}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {s.preferredCountries.slice(0, 3).map((c) => (
                        <span key={c} title={c} className="text-lg">
                          {COUNTRY_FLAGS[c] || c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {s.assignedCounselor ? (
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {s.assignedCounselor.firstName} {s.assignedCounselor.lastName}
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge priority-${s.priority.toLowerCase()} text-[10px]`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {formatDate(s.createdAt)}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/students/${s.id}`}
                      className="btn btn-ghost text-xs px-3 py-1.5"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
              No students found
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {q || stage ? "Try adjusting your filters" : "Add your first student to get started"}
            </p>
            {!q && !stage && (
              <Link href="/students/new" className="btn btn-primary mt-4">
                <Plus className="w-4 h-4" /> Add Student
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-1">
              {page > 1 && (
                <Link
                  href={`/students?q=${q}&stage=${stage}&page=${page - 1}`}
                  className="btn btn-secondary text-xs px-3 py-1.5"
                >
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/students?q=${q}&stage=${stage}&page=${page + 1}`}
                  className="btn btn-secondary text-xs px-3 py-1.5"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

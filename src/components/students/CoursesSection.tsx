"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChevronUp, Edit2, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentCourse {
  id: string;
  courseType: string;
  instituteName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  score: string | null;
  notes: string | null;
}

interface FormState {
  courseType: string;
  instituteName: string;
  status: string;
  startDate: string;
  endDate: string;
  score: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_TYPE_LABELS: Record<string, string> = {
  IELTS_PREP: "IELTS Preparation",
  TOEFL_PREP: "TOEFL Preparation",
  PTE_PREP: "PTE Preparation",
  DUOLINGO_PREP: "Duolingo Preparation",
  GRE_PREP: "GRE Preparation",
  GMAT_PREP: "GMAT Preparation",
  SAT_PREP: "SAT Preparation",
  ACT_PREP: "ACT Preparation",
  ENGLISH_LANGUAGE: "English Language",
  FOUNDATION_PROGRAM: "Foundation Program",
  OTHER: "Other",
};

const COURSE_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; border?: string }
> = {
  NEEDS: {
    label: "Needs to enroll",
    badgeClass: "badge-neutral",
  },
  ENROLLED: {
    label: "Currently enrolled",
    badgeClass: "badge-info",
    border: "var(--primary)",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "badge-success",
    border: "var(--success)",
  },
  DROPPED: {
    label: "Dropped",
    badgeClass: "badge-danger",
    border: "var(--danger)",
  },
};

const DEFAULT_FORM: FormState = {
  courseType: "IELTS_PREP",
  instituteName: "",
  status: "NEEDS",
  startDate: "",
  endDate: "",
  score: "",
  notes: "",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Course Form ──────────────────────────────────────────────────────────────

function CourseForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  initial: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="card p-5 animate-fade-in" style={{ borderLeft: "4px solid var(--accent)" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {initial.courseType && initial !== DEFAULT_FORM ? "Edit Course" : "Add Course"}
        </h4>
        <button
          onClick={onCancel}
          className="btn btn-ghost p-1"
          style={{ minWidth: 0, height: "auto" }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div
          className="text-sm p-3 rounded-lg mb-4"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Course Type
            </label>
            <select name="courseType" value={form.courseType} onChange={handleChange} className="input-base">
              {Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Status
            </label>
            <select name="status" value={form.status} onChange={handleChange} className="input-base">
              <option value="NEEDS">Needs to Enroll</option>
              <option value="ENROLLED">Currently Enrolled</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Institute Name
          </label>
          <input
            type="text"
            name="instituteName"
            value={form.instituteName}
            onChange={handleChange}
            className="input-base"
            placeholder="e.g. British Council"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Start Date
            </label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              End Date
            </label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="input-base" />
          </div>
        </div>

        {form.status === "COMPLETED" && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Score
            </label>
            <input
              type="text"
              name="score"
              value={form.score}
              onChange={handleChange}
              className="input-base"
              placeholder="e.g. 7.5"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Notes
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className="input-base"
            style={{ resize: "vertical" }}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
            {submitting ? "Saving..." : "Save Course"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoursesSection({ studentId }: { studentId: string }) {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<StudentCourse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/courses`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  function openAdd() {
    setEditingCourse(null);
    setShowForm(true);
    setFormError(null);
  }

  function openEdit(course: StudentCourse) {
    setEditingCourse(course);
    setShowForm(true);
    setFormError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCourse(null);
    setFormError(null);
  }

  async function handleSubmit(data: FormState) {
    setSubmitting(true);
    setFormError(null);
    try {
      const body = {
        courseType: data.courseType,
        instituteName: data.instituteName || undefined,
        status: data.status,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        score: data.status === "COMPLETED" && data.score ? data.score : undefined,
        notes: data.notes || undefined,
      };

      const url = editingCourse
        ? `/api/students/${studentId}/courses/${editingCourse.id}`
        : `/api/students/${studentId}/courses`;
      const method = editingCourse ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }

      closeForm();
      fetchCourses();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(courseId: string) {
    if (!confirm("Delete this course?")) return;
    try {
      const res = await fetch(`/api/students/${studentId}/courses/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCourses();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete");
      }
    } catch {
      alert("Something went wrong");
    }
  }

  const formInitial: FormState = editingCourse
    ? {
        courseType: editingCourse.courseType,
        instituteName: editingCourse.instituteName ?? "",
        status: editingCourse.status,
        startDate: editingCourse.startDate
          ? editingCourse.startDate.slice(0, 10)
          : "",
        endDate: editingCourse.endDate
          ? editingCourse.endDate.slice(0, 10)
          : "",
        score: editingCourse.score ?? "",
        notes: editingCourse.notes ?? "",
      }
    : DEFAULT_FORM;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse-soft" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Courses
          {courses.length > 0 && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              ({courses.length})
            </span>
          )}
        </h3>
        {!showForm ? (
          <button onClick={openAdd} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        ) : (
          <button onClick={closeForm} className="btn btn-secondary text-sm">
            <ChevronUp className="w-4 h-4" /> Collapse
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <CourseForm
          initial={formInitial}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
          error={formError}
        />
      )}

      {/* Course Cards */}
      <div className="space-y-3">
        {courses.map((course) => {
          const config = COURSE_STATUS_CONFIG[course.status] || COURSE_STATUS_CONFIG.NEEDS;
          const label = COURSE_TYPE_LABELS[course.courseType] || course.courseType;
          return (
            <div
              key={course.id}
              className="card p-4"
              style={config.border ? { borderLeft: `3px solid ${config.border}` } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {label}
                    </p>
                    <span className={`badge ${config.badgeClass}`}>{config.label}</span>
                  </div>

                  {course.instituteName && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {course.instituteName}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-1">
                    {(course.startDate || course.endDate) && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(course.startDate)}
                        {course.startDate && course.endDate ? " – " : ""}
                        {formatDate(course.endDate)}
                      </span>
                    )}
                    {course.status === "COMPLETED" && course.score && (
                      <span
                        className="badge badge-success text-xs"
                      >
                        Score: {course.score}
                      </span>
                    )}
                  </div>

                  {course.notes && (
                    <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>
                      {course.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(course)}
                    className="btn btn-secondary text-xs p-1.5"
                    style={{ minWidth: 0 }}
                    aria-label="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="btn text-xs p-1.5"
                    style={{
                      minWidth: 0,
                      background: "var(--danger-bg)",
                      color: "var(--danger)",
                      border: "1px solid var(--danger)",
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {courses.length === 0 && !showForm && (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No courses added yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

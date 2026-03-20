"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Student = { id: string; firstName: string; lastName: string };
type User = { id: string; firstName: string; lastName: string };

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  completedAt: string | null;
  student: Student | null;
  assignedTo: User;
  assignedBy: User;
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "#DC2626",
  HIGH: "#E8913A",
  MEDIUM: "#D97706",
  LOW: "#94A3B8",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-neutral",
  IN_PROGRESS: "badge-info",
  COMPLETED: "badge-success",
  CANCELLED: "badge-danger",
};

type FilterTab = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "OVERDUE", label: "Overdue" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate: string, status: string): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED" && new Date(dueDate) < new Date();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    studentId: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // Fetch users for assignedTo select
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch(() => setUsers([]));
  }, [fetchTasks]);

  // Search students when studentSearch changes
  useEffect(() => {
    if (studentSearch.length < 2) {
      setStudents([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&limit=10`)
        .then((r) => r.json())
        .then((data) => setStudents(data.students || []))
        .catch(() => setStudents([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "OVERDUE") return isOverdue(t.dueDate, t.status);
    return t.status === activeTab;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          assignedToId: form.assignedToId,
          studentId: form.studentId || null,
          priority: form.priority,
          dueDate: form.dueDate,
        }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        setForm({ title: "", description: "", assignedToId: "", studentId: "", priority: "MEDIUM", dueDate: "" });
        setStudentSearch("");
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkComplete(taskId: string) {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: "COMPLETED" as const, completedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTask) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${editTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTask.title,
          priority: editTask.priority,
          dueDate: editTask.dueDate,
          status: editTask.status,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditTask(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {tasks.length} total tasks
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm((v) => !v); setEditTask(null); }}
        >
          + Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>New Task</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Title <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                className="input-base"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Description
              </label>
              <textarea
                className="input-base"
                rows={3}
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Assign To <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                className="input-base"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                required
              >
                <option value="">Select counselor...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Student (optional)
              </label>
              <div className="relative">
                <input
                  className="input-base"
                  placeholder="Search student..."
                  value={studentSearch || (form.studentId ? students.find((s) => s.id === form.studentId)?.firstName + " " + students.find((s) => s.id === form.studentId)?.lastName : "")}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setForm({ ...form, studentId: "" });
                  }}
                />
                {students.length > 0 && !form.studentId && (
                  <div
                    className="absolute z-10 w-full mt-1 rounded-lg border shadow-md"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        style={{ color: "var(--text-primary)" }}
                        onClick={() => {
                          setForm({ ...form, studentId: s.id });
                          setStudentSearch(`${s.firstName} ${s.lastName}`);
                          setStudents([]);
                        }}
                      >
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Priority
              </label>
              <select
                className="input-base"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Due Date <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="date"
                className="input-base"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <div className="card p-5 animate-fade-in" style={{ borderLeft: "3px solid var(--accent)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Edit Task</h3>
          <form onSubmit={handleEditSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Title
              </label>
              <input
                className="input-base"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Priority
              </label>
              <select
                className="input-base"
                value={editTask.priority}
                onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as Task["priority"] })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Status
              </label>
              <select
                className="input-base"
                value={editTask.status}
                onChange={(e) => setEditTask({ ...editTask, status: e.target.value as Task["status"] })}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Due Date
              </label>
              <input
                type="date"
                className="input-base"
                value={editTask.dueDate.split("T")[0]}
                onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn btn-secondary" onClick={() => setEditTask(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => {
            const count =
              key === "ALL"
                ? tasks.length
                : key === "OVERDUE"
                ? tasks.filter((t) => isOverdue(t.dueDate, t.status)).length
                : tasks.filter((t) => t.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                style={
                  activeTab === key
                    ? { borderColor: "var(--primary)", color: "var(--primary)" }
                    : { borderColor: "transparent", color: "var(--text-secondary)" }
                }
              >
                {label}
                {count > 0 && (
                  <span
                    className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: activeTab === key ? "var(--primary-50)" : "#F1F5F9",
                      color: activeTab === key ? "var(--primary)" : "var(--text-muted)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {activeTab === "ALL"
              ? "No tasks yet. Create your first task!"
              : activeTab === "OVERDUE"
              ? "No overdue tasks. Great job!"
              : `No ${activeTab.toLowerCase().replace("_", " ")} tasks.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <div
                key={task.id}
                className="card p-4 flex items-start gap-4"
                style={overdue ? { borderLeft: "3px solid var(--danger)" } : undefined}
              >
                {/* Priority dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: PRIORITY_DOT[task.priority] }}
                  title={task.priority}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
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
                  </div>
                  {task.description && (
                    <p className="text-xs mt-1 truncate-2" style={{ color: "var(--text-secondary)" }}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Assigned to:{" "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: overdue ? "var(--danger)" : "var(--text-muted)" }}
                    >
                      {overdue ? "⚠ Overdue: " : "Due: "}
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`badge ${STATUS_BADGE[task.status]}`}>
                    {task.status.replace("_", " ")}
                  </span>
                  <div className="flex gap-1">
                    {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                      <button
                        className="btn btn-secondary text-xs px-2 py-1"
                        onClick={() => handleMarkComplete(task.id)}
                        title="Mark Complete"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="btn btn-secondary text-xs px-2 py-1"
                      onClick={() => { setEditTask(task); setShowForm(false); }}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger text-xs px-2 py-1"
                      onClick={() => handleDelete(task.id)}
                      title="Delete"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

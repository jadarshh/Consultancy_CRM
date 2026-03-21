"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, X, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoggedBy {
  id: string;
  firstName: string;
  lastName: string;
}

interface CommunicationLog {
  id: string;
  studentId: string;
  type: string;
  direction: string;
  subject: string | null;
  summary: string;
  durationMinutes: number | null;
  outcome: string | null;
  followUpDate: string | null;
  loggedById: string;
  createdAt: string;
  loggedBy: LoggedBy;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  PHONE_CALL: "📞",
  WHATSAPP: "💬",
  EMAIL: "📧",
  SMS: "📱",
  IN_PERSON: "🤝",
  VIDEO_CALL: "📹",
  OTHER: "💬",
};

const TYPE_COLORS: Record<string, string> = {
  PHONE_CALL: "#1B4332",   // was #4A90D9 (blue)
  WHATSAPP: "#16A34A",
  EMAIL: "#7C3AED",
  SMS: "#64748B",
  IN_PERSON: "#D4A853",    // was #E8913A (accent gold)
  VIDEO_CALL: "#0D9488",   // was #0EA5E9 (teal)
  OTHER: "#94A3B8",
};

const OUTCOME_LABELS: Record<string, string> = {
  CONNECTED: "Connected",
  NO_ANSWER: "No Answer",
  VOICEMAIL: "Voicemail",
  BUSY: "Busy",
  CALLBACK_REQUESTED: "Callback Requested",
  OTHER: "Other",
};

function formatDate(dateStr: string | null | undefined, fmt?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  if (fmt === "short") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function snakeToTitle(str: string): string {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="text-4xl mb-3">📋</div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
        No communications logged yet
      </p>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Start tracking interactions with this student
      </p>
      <button onClick={onAdd} className="btn btn-primary text-sm">
        <Plus className="w-4 h-4" /> Log First Communication
      </button>
    </div>
  );
}

// ─── Communication Card ───────────────────────────────────────────────────────

function CommunicationCard({ log }: { log: CommunicationLog }) {
  const borderColor = TYPE_COLORS[log.type] || "#94A3B8";
  const icon = TYPE_ICONS[log.type] || "💬";
  const outcomeLabel = log.outcome ? OUTCOME_LABELS[log.outcome] || snakeToTitle(log.outcome) : null;

  return (
    <div
      className="card p-4"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
              {log.subject || snakeToTitle(log.type)}
            </p>
            <span
              className="badge"
              style={
                log.direction === "INBOUND"
                  ? { background: "var(--success-bg)", color: "var(--success)" }
                  : { background: "var(--primary-50)", color: "var(--primary)" }
              }
            >
              {log.direction === "INBOUND" ? "Inbound" : "Outbound"}
            </span>
            {outcomeLabel && (
              <span className="badge badge-neutral text-[10px]">{outcomeLabel}</span>
            )}
            {log.durationMinutes && (
              <span className="badge badge-neutral text-[10px]">{log.durationMinutes} min</span>
            )}
          </div>

          {/* Summary note box */}
          <div
            className="rounded-lg p-3 my-2 text-sm"
            style={{ background: "var(--primary-50)", color: "var(--text-secondary)" }}
          >
            {log.summary}
          </div>

          {/* Follow-up date */}
          {log.followUpDate && (
            <p
              className="text-xs flex items-center gap-1 mb-1"
              style={{ color: "var(--warning)" }}
            >
              <Clock className="w-3 h-3" />
              Follow up: {formatDate(log.followUpDate, "short")}
            </p>
          )}

          {/* Footer */}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            by {log.loggedBy.firstName} {log.loggedBy.lastName} · {timeAgo(log.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

interface FormState {
  type: string;
  direction: string;
  subject: string;
  summary: string;
  outcome: string;
  followUpDate: string;
  durationMinutes: string;
}

const DEFAULT_FORM: FormState = {
  type: "PHONE_CALL",
  direction: "OUTBOUND",
  subject: "",
  summary: "",
  outcome: "",
  followUpDate: "",
  durationMinutes: "",
};

function AddCommunicationForm({
  studentId,
  onSuccess,
  onCancel,
}: {
  studentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim()) {
      setError("Summary is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${studentId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          direction: form.direction,
          subject: form.subject || undefined,
          summary: form.summary,
          outcome: form.outcome || undefined,
          followUpDate: form.followUpDate || undefined,
          durationMinutes: form.durationMinutes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log communication");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5 animate-fade-in" style={{ borderLeft: "4px solid var(--accent)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
          Log Communication
        </h3>
        <button
          onClick={onCancel}
          className="btn btn-ghost p-1"
          style={{ minWidth: 0, height: "auto" }}
          aria-label="Close form"
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type + Direction */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="input-base"
            >
              <option value="PHONE_CALL">📞 Phone Call</option>
              <option value="WHATSAPP">💬 WhatsApp</option>
              <option value="EMAIL">📧 Email</option>
              <option value="SMS">📱 SMS</option>
              <option value="IN_PERSON">🤝 In Person</option>
              <option value="VIDEO_CALL">📹 Video Call</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Direction
            </label>
            <select
              name="direction"
              value={form.direction}
              onChange={handleChange}
              className="input-base"
            >
              <option value="OUTBOUND">Outbound</option>
              <option value="INBOUND">Inbound</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            className="input-base"
            placeholder="e.g. Follow-up on university selection"
          />
        </div>

        {/* Summary — prominent field */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Communication Summary / Notes <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            required
            rows={4}
            className="input-base"
            style={{
              background: "var(--primary-50)",
              resize: "vertical",
            }}
            placeholder="Write a summary of what was discussed, decisions made, next steps..."
          />
        </div>

        {/* Outcome + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Outcome
            </label>
            <select
              name="outcome"
              value={form.outcome}
              onChange={handleChange}
              className="input-base"
            >
              <option value="">— Select outcome —</option>
              <option value="CONNECTED">Connected</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="VOICEMAIL">Voicemail</option>
              <option value="BUSY">Busy</option>
              <option value="CALLBACK_REQUESTED">Callback Requested</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Duration (minutes)
            </label>
            <input
              type="number"
              name="durationMinutes"
              value={form.durationMinutes}
              onChange={handleChange}
              className="input-base"
              placeholder="e.g. 15"
              min="0"
            />
          </div>
        </div>

        {/* Follow-up date */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Schedule Follow-up
          </label>
          <input
            type="date"
            name="followUpDate"
            value={form.followUpDate}
            onChange={handleChange}
            className="input-base"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary text-sm"
          >
            {submitting ? "Saving..." : "Log Communication"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommunicationSection({ studentId }: { studentId: string }) {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/communications`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleSuccess() {
    setShowForm(false);
    fetchLogs();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card p-4 animate-pulse-soft"
            style={{ height: 100 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Communication Log
          {logs.length > 0 && (
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--text-muted)" }}
            >
              ({logs.length})
            </span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary text-sm"
          >
            <Plus className="w-4 h-4" /> Add Communication
          </button>
        )}
        {showForm && (
          <button
            onClick={() => setShowForm(false)}
            className="btn btn-secondary text-sm"
          >
            <ChevronUp className="w-4 h-4" /> Collapse
          </button>
        )}
      </div>

      {/* Inline Add Form — shown above list */}
      {showForm && (
        <AddCommunicationForm
          studentId={studentId}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* List */}
      {logs.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <CommunicationCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChevronUp, Edit2, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyMember {
  id: string;
  relationship: string;
  name: string;
  occupation: string | null;
  employer: string | null;
  annualIncome: number | null;
  incomeCurrency: string;
  phone: string | null;
  email: string | null;
  education: string | null;
  address: string | null;
  isSponsor: boolean;
  incomeSource: string | null;
}

interface FormState {
  relationship: string;
  name: string;
  occupation: string;
  employer: string;
  annualIncome: string;
  incomeCurrency: string;
  phone: string;
  email: string;
  education: string;
  address: string;
  isSponsor: boolean;
  incomeSource: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RELATIONSHIP_ICONS: Record<string, string> = {
  FATHER: "👨",
  MOTHER: "👩",
  SPOUSE: "💑",
  SIBLING: "👫",
  GUARDIAN: "🧑",
  OTHER: "👤",
};

const DEFAULT_FORM: FormState = {
  relationship: "FATHER",
  name: "",
  occupation: "",
  employer: "",
  annualIncome: "",
  incomeCurrency: "NPR",
  phone: "",
  email: "",
  education: "",
  address: "",
  isSponsor: false,
  incomeSource: "",
};

function snakeToTitle(str: string): string {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number | null, currency = "USD"): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Form Component ───────────────────────────────────────────────────────────

function FamilyMemberForm({
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
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  return (
    <div className="card p-5 animate-fade-in" style={{ borderLeft: "4px solid var(--accent)" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {initial.name ? "Edit Family Member" : "Add Family Member"}
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
              Relationship
            </label>
            <select name="relationship" value={form.relationship} onChange={handleChange} className="input-base">
              <option value="FATHER">Father</option>
              <option value="MOTHER">Mother</option>
              <option value="SPOUSE">Spouse</option>
              <option value="SIBLING">Sibling</option>
              <option value="GUARDIAN">Guardian</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Name <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="input-base"
              placeholder="Full name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Occupation
            </label>
            <input type="text" name="occupation" value={form.occupation} onChange={handleChange} className="input-base" placeholder="e.g. Teacher" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Employer
            </label>
            <input type="text" name="employer" value={form.employer} onChange={handleChange} className="input-base" placeholder="Company / Organization" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Annual / Gross Income
            </label>
            <input type="number" name="annualIncome" value={form.annualIncome} onChange={handleChange} className="input-base" placeholder="0" min="0" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Currency
            </label>
            <select name="incomeCurrency" value={form.incomeCurrency} onChange={handleChange} className="input-base">
              <option value="NPR">NPR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
              <option value="INR">INR</option>
              <option value="PKR">PKR</option>
              <option value="BDT">BDT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Phone
            </label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input-base" placeholder="+977..." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-base" placeholder="email@example.com" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Education
          </label>
          <input type="text" name="education" value={form.education} onChange={handleChange} className="input-base" placeholder="e.g. Bachelor's in Commerce" />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className="input-base"
            style={{ resize: "vertical" }}
            placeholder="Current address"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Income Source
          </label>
          <input
            type="text"
            name="incomeSource"
            value={form.incomeSource}
            onChange={handleChange}
            className="input-base"
            placeholder="e.g. Business, Job, Property"
          />
        </div>

        {/* Sponsor checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isSponsor"
            checked={form.isSponsor}
            onChange={handleChange}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This person is a financial sponsor
          </span>
        </label>

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
            {submitting ? "Saving..." : initial.name ? "Save Changes" : "Add Member"}
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

export default function FamilySection({ studentId }: { studentId: string }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/family`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function openAdd() {
    setEditingMember(null);
    setShowForm(true);
    setFormError(null);
  }

  function openEdit(member: FamilyMember) {
    setEditingMember(member);
    setShowForm(true);
    setFormError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingMember(null);
    setFormError(null);
  }

  async function handleSubmit(data: FormState) {
    setSubmitting(true);
    setFormError(null);
    try {
      const body = {
        relationship: data.relationship,
        name: data.name,
        occupation: data.occupation || undefined,
        employer: data.employer || undefined,
        annualIncome: data.annualIncome ? parseFloat(data.annualIncome) : undefined,
        incomeCurrency: data.incomeCurrency,
        phone: data.phone || undefined,
        email: data.email || undefined,
        education: data.education || undefined,
        address: data.address || undefined,
        isSponsor: data.isSponsor,
        incomeSource: data.incomeSource || undefined,
      };

      const url = editingMember
        ? `/api/students/${studentId}/family/${editingMember.id}`
        : `/api/students/${studentId}/family`;
      const method = editingMember ? "PATCH" : "POST";

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
      fetchMembers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(memberId: string) {
    if (!confirm("Delete this family member?")) return;
    try {
      const res = await fetch(`/api/students/${studentId}/family/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete");
      }
    } catch {
      alert("Something went wrong");
    }
  }

  const formInitial: FormState = editingMember
    ? {
        relationship: editingMember.relationship,
        name: editingMember.name,
        occupation: editingMember.occupation ?? "",
        employer: editingMember.employer ?? "",
        annualIncome: editingMember.annualIncome != null ? String(editingMember.annualIncome) : "",
        incomeCurrency: editingMember.incomeCurrency,
        phone: editingMember.phone ?? "",
        email: editingMember.email ?? "",
        education: editingMember.education ?? "",
        address: editingMember.address ?? "",
        isSponsor: editingMember.isSponsor,
        incomeSource: editingMember.incomeSource ?? "",
      }
    : DEFAULT_FORM;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
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
          Family Members
          {members.length > 0 && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              ({members.length})
            </span>
          )}
        </h3>
        {!showForm ? (
          <button onClick={openAdd} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Family Member
          </button>
        ) : (
          <button onClick={closeForm} className="btn btn-secondary text-sm">
            <ChevronUp className="w-4 h-4" /> Collapse
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <FamilyMemberForm
          initial={formInitial}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
          error={formError}
        />
      )}

      {/* Member Cards */}
      <div className="space-y-3">
        {members.map((member) => {
          const icon = RELATIONSHIP_ICONS[member.relationship] || "👤";
          return (
            <div
              key={member.id}
              className="card p-4"
              style={
                member.isSponsor
                  ? { borderLeft: "3px solid var(--accent)" }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {member.name}
                      </p>
                      <span className="badge badge-neutral text-[10px]">
                        {snakeToTitle(member.relationship)}
                      </span>
                      {member.isSponsor && (
                        <span
                          className="badge text-[10px] font-bold"
                          style={{ background: "var(--accent)", color: "white" }}
                        >
                          SPONSOR
                        </span>
                      )}
                    </div>

                    {member.occupation && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {member.occupation}
                        {member.employer ? ` at ${member.employer}` : ""}
                      </p>
                    )}

                    {member.incomeSource && (
                      <p
                        className="text-xs mt-1 font-medium"
                        style={{ color: "var(--accent)" }}
                      >
                        Income Source: {member.incomeSource}
                      </p>
                    )}

                    {member.annualIncome != null && (
                      <p
                        className={`text-xs mt-0.5 ${member.isSponsor ? "font-semibold" : ""}`}
                        style={{ color: member.isSponsor ? "var(--accent)" : "var(--text-muted)" }}
                      >
                        Annual Income: {formatCurrency(member.annualIncome, member.incomeCurrency)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-1">
                      {member.phone && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          📞 {member.phone}
                        </span>
                      )}
                      {member.email && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          ✉️ {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(member)}
                    className="btn btn-secondary text-xs p-1.5"
                    style={{ minWidth: 0 }}
                    aria-label="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
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

        {members.length === 0 && !showForm && (
          <div className="card p-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No family members added yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

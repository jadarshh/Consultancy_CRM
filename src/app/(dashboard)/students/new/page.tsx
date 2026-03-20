"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface Counselor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const PREFERRED_COUNTRIES = [
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "US", label: "United States" },
  { code: "DE", label: "Germany" },
  { code: "NZ", label: "New Zealand" },
];

const SECTION_HEADER: React.CSSProperties = {
  background: "var(--primary)",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "8px 8px 0 0",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.02em",
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={SECTION_HEADER}>{title}</div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

type FormData = {
  // Basic
  firstName: string;
  lastName: string;
  email: string;
  phonePrimary: string;
  whatsappNumber: string;
  source: string;
  priority: string;
  // Personal
  dateOfBirth: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  // Preferences
  preferredCountries: string[];
  preferredLevel: string;
  preferredField: string;
  preferredIntake: string;
  budgetMin: string;
  budgetMax: string;
  budgetCurrency: string;
  // Passport
  passportNumber: string;
  passportExpiryDate: string;
  passportIssueDate: string;
  // Address
  currentCity: string;
  currentState: string;
  currentCountry: string;
  currentAddress: string;
  // Financial
  fundingSource: string;
  annualFamilyIncome: string;
  incomeCurrency: string;
  bankBalance: string;
  // Assignment
  assignedCounselorId: string;
};

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phonePrimary: "",
  whatsappNumber: "",
  source: "",
  priority: "MEDIUM",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  maritalStatus: "",
  preferredCountries: [],
  preferredLevel: "",
  preferredField: "",
  preferredIntake: "",
  budgetMin: "",
  budgetMax: "",
  budgetCurrency: "USD",
  passportNumber: "",
  passportExpiryDate: "",
  passportIssueDate: "",
  currentCity: "",
  currentState: "",
  currentCountry: "",
  currentAddress: "",
  fundingSource: "",
  annualFamilyIncome: "",
  incomeCurrency: "USD",
  bankBalance: "",
  assignedCounselorId: "",
};

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users?role=COUNSELOR")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCounselors(data);
      })
      .catch(() => {});
  }, []);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCountry(code: string) {
    setForm((prev) => {
      const current = prev.preferredCountries;
      return {
        ...prev,
        preferredCountries: current.includes(code)
          ? current.filter((c) => c !== code)
          : [...current, code],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create student");
        return;
      }

      router.push(`/students/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-sm hover:underline mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Add New Student
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Fill in the student details below. Fields marked with * are required.
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl text-sm font-medium"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Info */}
        <SectionCard title="1. Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input
                className="input-base"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="e.g. John"
                required
              />
            </Field>
            <Field label="Last Name" required>
              <input
                className="input-base"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="e.g. Doe"
                required
              />
            </Field>
            <Field label="Email Address" required>
              <input
                type="email"
                className="input-base"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@example.com"
                required
              />
            </Field>
            <Field label="Primary Phone" required>
              <input
                type="tel"
                className="input-base"
                value={form.phonePrimary}
                onChange={(e) => set("phonePrimary", e.target.value)}
                placeholder="+1 234 567 8900"
                required
              />
            </Field>
            <Field label="WhatsApp Number">
              <input
                type="tel"
                className="input-base"
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </Field>
            <Field label="Lead Source" required>
              <select
                className="input-base"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                required
              >
                <option value="">Select source...</option>
                <option value="WALK_IN">Walk In</option>
                <option value="PHONE">Phone</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="AGENT">Agent</option>
                <option value="EVENT">Event</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Priority">
              <select
                className="input-base"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Section 2: Personal */}
        <SectionCard title="2. Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of Birth">
              <input
                type="date"
                className="input-base"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </Field>
            <Field label="Gender">
              <select
                className="input-base"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="">Select gender...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Nationality">
              <input
                className="input-base"
                value={form.nationality}
                onChange={(e) => set("nationality", e.target.value)}
                placeholder="e.g. Indian"
              />
            </Field>
            <Field label="Marital Status">
              <select
                className="input-base"
                value={form.maritalStatus}
                onChange={(e) => set("maritalStatus", e.target.value)}
              >
                <option value="">Select status...</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Section 3: Preferences */}
        <SectionCard title="3. Study Preferences">
          <Field label="Preferred Countries">
            <div className="flex flex-wrap gap-2 mt-1">
              {PREFERRED_COUNTRIES.map(({ code, label }) => {
                const checked = form.preferredCountries.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleCountry(code)}
                    className="btn text-sm px-3 py-1.5"
                    style={{
                      background: checked ? "var(--primary)" : "var(--surface)",
                      color: checked ? "#fff" : "var(--text-primary)",
                      border: `1px solid ${checked ? "var(--primary)" : "var(--border)"}`,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Preferred Study Level">
              <select
                className="input-base"
                value={form.preferredLevel}
                onChange={(e) => set("preferredLevel", e.target.value)}
              >
                <option value="">Select level...</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="BACHELORS">Bachelor's</option>
                <option value="MASTERS">Master's</option>
                <option value="PHD">PhD</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="PATHWAY">Pathway</option>
                <option value="FOUNDATION">Foundation</option>
              </select>
            </Field>
            <Field label="Preferred Field of Study">
              <input
                className="input-base"
                value={form.preferredField}
                onChange={(e) => set("preferredField", e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </Field>
            <Field label="Preferred Intake">
              <input
                className="input-base"
                value={form.preferredIntake}
                onChange={(e) => set("preferredIntake", e.target.value)}
                placeholder="e.g. September 2026"
              />
            </Field>
            <Field label="Budget Currency">
              <select
                className="input-base"
                value={form.budgetCurrency}
                onChange={(e) => set("budgetCurrency", e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
                <option value="NZD">NZD</option>
              </select>
            </Field>
            <Field label="Budget Min">
              <input
                type="number"
                className="input-base"
                value={form.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                placeholder="10000"
                min="0"
              />
            </Field>
            <Field label="Budget Max">
              <input
                type="number"
                className="input-base"
                value={form.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                placeholder="50000"
                min="0"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Section 4: Passport */}
        <SectionCard title="4. Passport Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Passport Number">
              <input
                className="input-base"
                value={form.passportNumber}
                onChange={(e) => set("passportNumber", e.target.value)}
                placeholder="e.g. A1234567"
              />
            </Field>
            <Field label="Passport Issue Date">
              <input
                type="date"
                className="input-base"
                value={form.passportIssueDate}
                onChange={(e) => set("passportIssueDate", e.target.value)}
              />
            </Field>
            <Field label="Passport Expiry Date">
              <input
                type="date"
                className="input-base"
                value={form.passportExpiryDate}
                onChange={(e) => set("passportExpiryDate", e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Section 5: Contact / Address */}
        <SectionCard title="5. Contact &amp; Address">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Current Address">
              <input
                className="input-base"
                value={form.currentAddress}
                onChange={(e) => set("currentAddress", e.target.value)}
                placeholder="Street address"
              />
            </Field>
            <Field label="City">
              <input
                className="input-base"
                value={form.currentCity}
                onChange={(e) => set("currentCity", e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </Field>
            <Field label="State / Province">
              <input
                className="input-base"
                value={form.currentState}
                onChange={(e) => set("currentState", e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </Field>
            <Field label="Country">
              <input
                className="input-base"
                value={form.currentCountry}
                onChange={(e) => set("currentCountry", e.target.value)}
                placeholder="e.g. India"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Section 6: Financial */}
        <SectionCard title="6. Financial Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Funding Source">
              <select
                className="input-base"
                value={form.fundingSource}
                onChange={(e) => set("fundingSource", e.target.value)}
              >
                <option value="">Select source...</option>
                <option value="SELF">Self</option>
                <option value="FAMILY">Family</option>
                <option value="SCHOLARSHIP">Scholarship</option>
                <option value="LOAN">Loan</option>
                <option value="MIXED">Mixed</option>
              </select>
            </Field>
            <Field label="Income Currency">
              <select
                className="input-base"
                value={form.incomeCurrency}
                onChange={(e) => set("incomeCurrency", e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <Field label="Annual Family Income">
              <input
                type="number"
                className="input-base"
                value={form.annualFamilyIncome}
                onChange={(e) => set("annualFamilyIncome", e.target.value)}
                placeholder="e.g. 50000"
                min="0"
              />
            </Field>
            <Field label="Bank Balance">
              <input
                type="number"
                className="input-base"
                value={form.bankBalance}
                onChange={(e) => set("bankBalance", e.target.value)}
                placeholder="e.g. 20000"
                min="0"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Assignment */}
        <SectionCard title="7. Assignment">
          <Field label="Assign Counselor">
            <select
              className="input-base"
              value={form.assignedCounselorId}
              onChange={(e) => set("assignedCounselorId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* Submit */}
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}
        >
          <Link href="/students" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>
    </div>
  );
}

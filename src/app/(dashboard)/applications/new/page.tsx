"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  referenceNumber: string;
};

type Country = {
  id: string;
  name: string;
  code: string;
  flagEmoji: string | null;
};

type University = {
  id: string;
  name: string;
  country: Country;
};

type Program = {
  id: string;
  name: string;
  level: string;
  field: string;
  tuitionFee: number;
  feeCurrency: string;
  university: University;
};

type Intake = {
  id: string;
  name: string;
  startDate: string;
  countryId: string;
};

export default function NewApplicationPage() {
  const router = useRouter();

  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [programSearch, setProgramSearch] = useState("");
  const [programResults, setProgramResults] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState("");

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Student search
  useEffect(() => {
    if (studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(studentSearch)}`)
        .then((r) => r.json())
        .then((d) => setStudentResults(d.students || []))
        .catch(() => setStudentResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // Program search
  useEffect(() => {
    if (programSearch.length < 2) {
      setProgramResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/programs?search=${encodeURIComponent(programSearch)}`)
        .then((r) => r.json())
        .then((d) => setProgramResults(Array.isArray(d) ? d : []))
        .catch(() => setProgramResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [programSearch]);

  // Load intakes for selected program's country
  const loadIntakes = useCallback(async (countryId: string) => {
    try {
      const res = await fetch(`/api/intakes?countryId=${countryId}`);
      const data = await res.json();
      setIntakes(Array.isArray(data) ? data : []);
    } catch {
      setIntakes([]);
    }
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadIntakes(selectedProgram.university.country.id);
    } else {
      setIntakes([]);
      setSelectedIntakeId("");
    }
  }, [selectedProgram, loadIntakes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedStudent || !selectedProgram) {
      setError("Please select a student and program.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          programId: selectedProgram.id,
          intakeId: selectedIntakeId || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create application");
        return;
      }

      const application = await res.json();
      router.push(`/applications/${application.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/applications"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back to Applications
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          New Application
        </h1>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Student */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Student <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          {selectedStudent ? (
            <div
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{ borderColor: "var(--border)", background: "var(--primary-50)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {selectedStudent.referenceNumber}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary text-xs px-2 py-1"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentSearch("");
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                className="input-base"
                placeholder="Search student by name or reference..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              {studentResults.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg border shadow-md overflow-hidden"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {studentResults.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm border-b last:border-0 hover:bg-gray-50"
                      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                      onClick={() => {
                        setSelectedStudent(s);
                        setStudentSearch("");
                        setStudentResults([]);
                      }}
                    >
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.referenceNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Program */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Program <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          {selectedProgram ? (
            <div
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{ borderColor: "var(--border)", background: "var(--primary-50)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  {selectedProgram.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {selectedProgram.university.name} · {selectedProgram.university.country.name}
                  {selectedProgram.university.country.flagEmoji && ` ${selectedProgram.university.country.flagEmoji}`}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary text-xs px-2 py-1"
                onClick={() => {
                  setSelectedProgram(null);
                  setProgramSearch("");
                  setSelectedIntakeId("");
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                className="input-base"
                placeholder="Search program or university..."
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
              />
              {programResults.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg border shadow-md overflow-hidden"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {programResults.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm border-b last:border-0 hover:bg-gray-50"
                      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                      onClick={() => {
                        setSelectedProgram(p);
                        setProgramSearch("");
                        setProgramResults([]);
                      }}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {p.university.name} · {p.university.country.flagEmoji || p.university.country.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Intake */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Intake
          </label>
          <select
            className="input-base"
            value={selectedIntakeId}
            onChange={(e) => setSelectedIntakeId(e.target.value)}
            disabled={!selectedProgram || intakes.length === 0}
          >
            <option value="">
              {!selectedProgram
                ? "Select a program first"
                : intakes.length === 0
                ? "No intakes available"
                : "Select intake (optional)"}
            </option>
            {intakes.map((intake) => (
              <option key={intake.id} value={intake.id}>
                {intake.name} — {new Date(intake.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Notes
          </label>
          <textarea
            className="input-base"
            rows={4}
            placeholder="Any notes about this application..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Status */}
        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{ background: "var(--primary-50)" }}
        >
          <span className="badge badge-neutral">DRAFT</span>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Application will be created with DRAFT status
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Link href="/applications" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !selectedStudent || !selectedProgram}
          >
            {submitting ? "Creating..." : "Create Application"}
          </button>
        </div>
      </form>
    </div>
  );
}

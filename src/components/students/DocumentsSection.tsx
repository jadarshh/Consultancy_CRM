"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  notes: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_STATUS_BADGE: Record<string, string> = {
  VERIFIED: "badge-success",
  PENDING_REVIEW: "badge-warning",
  REJECTED: "badge-danger",
};

const DOC_STATUS_BORDER: Record<string, string> = {
  VERIFIED: "var(--success)",
  PENDING_REVIEW: "var(--warning)",
  REJECTED: "var(--danger)",
};

function snakeToTitle(str: string): string {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentsSection({ studentId }: { studentId: string }) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Upload form state
  const [documentType, setDocumentType] = useState("PASSPORT");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/documents`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a file");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (notes) formData.append("notes", notes);

      const res = await fetch(`/api/students/${studentId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setFile(null);
      setDocumentType("PASSPORT");
      setNotes("");
      setShowForm(false);
      fetchDocuments();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/students/${studentId}/documents?docId=${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDocuments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete document");
      }
    } catch {
      alert("Something went wrong");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse-soft" style={{ height: 72 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Documents
          {documents.length > 0 && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              ({documents.length})
            </span>
          )}
        </h3>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        ) : (
          <button onClick={() => setShowForm(false)} className="btn btn-secondary text-sm">
            <ChevronUp className="w-4 h-4" /> Collapse
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showForm && (
        <div
          className="card p-5 animate-fade-in"
          style={{ borderLeft: "4px solid var(--accent)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Upload Document
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="btn btn-ghost p-1"
              style={{ minWidth: 0, height: "auto" }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {uploadError && (
            <div
              className="text-sm p-3 rounded-lg mb-4"
              style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
            >
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="input-base"
              >
                <optgroup label="Identity Documents">
                  <option value="PASSPORT">Passport</option>
                  <option value="PASSPORT_PHOTO">Passport Photo</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                </optgroup>
                <optgroup label="Academic">
                  <option value="ACADEMIC_TRANSCRIPT_SECONDARY">Academic Transcript (Secondary)</option>
                  <option value="ACADEMIC_TRANSCRIPT_HIGHER_SECONDARY">Academic Transcript (Higher Secondary)</option>
                  <option value="ACADEMIC_TRANSCRIPT_BACHELORS">Academic Transcript (Bachelors)</option>
                  <option value="ACADEMIC_TRANSCRIPT_MASTERS">Academic Transcript (Masters)</option>
                  <option value="DEGREE_CERTIFICATE">Degree Certificate</option>
                  <option value="PROVISIONAL_CERTIFICATE">Provisional Certificate</option>
                </optgroup>
                <optgroup label="Test Score Cards">
                  <option value="IELTS_SCORECARD">IELTS Scorecard</option>
                  <option value="TOEFL_SCORECARD">TOEFL Scorecard</option>
                  <option value="PTE_SCORECARD">PTE Scorecard</option>
                  <option value="DUOLINGO_SCORECARD">Duolingo Scorecard</option>
                  <option value="GRE_SCORECARD">GRE Scorecard</option>
                  <option value="GMAT_SCORECARD">GMAT Scorecard</option>
                  <option value="SAT_SCORECARD">SAT Scorecard</option>
                </optgroup>
                <optgroup label="Application Documents">
                  <option value="CV_RESUME">CV / Resume</option>
                  <option value="SOP">Statement of Purpose (SOP)</option>
                  <option value="LOR_1">Letter of Recommendation 1</option>
                  <option value="LOR_2">Letter of Recommendation 2</option>
                  <option value="LOR_3">Letter of Recommendation 3</option>
                </optgroup>
                <optgroup label="Financial">
                  <option value="BANK_STATEMENT">Bank Statement</option>
                  <option value="INCOME_TAX_RETURN">Income Tax Return</option>
                  <option value="SPONSORSHIP_LETTER">Sponsorship Letter</option>
                  <option value="AFFIDAVIT_OF_SUPPORT">Affidavit of Support</option>
                  <option value="PROPERTY_DOCUMENTS">Property Documents</option>
                  <option value="FIXED_DEPOSIT_RECEIPT">Fixed Deposit Receipt</option>
                </optgroup>
                <optgroup label="Visa &amp; Travel">
                  <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
                  <option value="POLICE_CLEARANCE">Police Clearance</option>
                  <option value="VISA_COPY">Visa Copy</option>
                  <option value="OFFER_LETTER">Offer Letter</option>
                  <option value="COE">COE</option>
                  <option value="CAS">CAS</option>
                  <option value="I20">I-20</option>
                  <option value="TRAVEL_INSURANCE">Travel Insurance</option>
                  <option value="FLIGHT_TICKET">Flight Ticket</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="WORK_EXPERIENCE_LETTER">Work Experience Letter</option>
                  <option value="GAP_CERTIFICATE">Gap Certificate</option>
                  <option value="OTHER">Other</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                File
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="input-base"
                style={{ padding: "6px 10px" }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Description / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-base"
                rows={3}
                placeholder="Optional notes about this document"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={uploading}
                className="btn btn-primary text-sm"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Document Cards */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const badgeClass = DOC_STATUS_BADGE[doc.status] || "badge-neutral";
          const borderColor = DOC_STATUS_BORDER[doc.status] || "var(--border)";
          return (
            <div
              key={doc.id}
              className="card p-4 flex items-center gap-4"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {snakeToTitle(doc.documentType)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {doc.fileName} · {formatDate(doc.createdAt)}
                </p>
                {doc.notes && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {doc.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge ${badgeClass}`}>
                  {snakeToTitle(doc.status)}
                </span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs px-3 py-1.5"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="btn text-xs px-3 py-1.5"
                  style={{
                    background: "var(--danger-bg)",
                    color: "var(--danger)",
                    border: "1px solid var(--danger)",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {documents.length === 0 && !showForm && (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No documents uploaded yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

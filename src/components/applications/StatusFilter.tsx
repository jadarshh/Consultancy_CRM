"use client";

import { useRouter } from "next/navigation";

const ALL_STATUSES = [
  "DRAFT", "DOCUMENTS_PENDING", "READY_TO_SUBMIT", "SUBMITTED", "UNDER_REVIEW",
  "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "OFFER_ACCEPTED", "OFFER_DECLINED",
  "TUITION_DEPOSIT_PAID", "CAS_REQUESTED", "CAS_RECEIVED", "COE_REQUESTED", "COE_RECEIVED",
  "I20_REQUESTED", "I20_RECEIVED", "VISA_DOCUMENTS_READY", "VISA_APPLIED",
  "VISA_INTERVIEW_SCHEDULED", "VISA_APPROVED", "VISA_REFUSED", "ENROLLED",
  "DEFERRED", "WITHDRAWN", "REJECTED",
];

function snakeToTitle(str: string): string {
  return str.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusFilter({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    router.push(val ? `/applications?status=${val}` : "/applications");
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        Filter by status:
      </label>
      <select
        value={currentStatus || ""}
        onChange={handleChange}
        className="input-base"
        style={{ width: "auto", minWidth: 200 }}
      >
        <option value="">All Statuses</option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {snakeToTitle(s)}
          </option>
        ))}
      </select>
    </div>
  );
}

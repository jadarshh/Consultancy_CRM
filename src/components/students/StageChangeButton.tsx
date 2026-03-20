"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAGE_LABELS, PIPELINE_STAGES, TERMINAL_STAGES } from "@/lib/utils";

const ALL_STAGES = [...PIPELINE_STAGES, ...TERMINAL_STAGES];

interface StageChangeButtonProps {
  studentId: string;
  currentStage: string;
  userRole: string;
}

export function StageChangeButton({ studentId, currentStage, userRole }: StageChangeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDisabled = userRole === "RECEPTIONIST";

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStage = e.target.value;
    if (!newStage || newStage === currentStage) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${studentId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update stage");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (isDisabled) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStage}
        onChange={handleChange}
        disabled={loading}
        className="text-xs rounded-lg border px-2 py-1 font-medium cursor-pointer transition-all"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
          color: "var(--text-primary)",
          opacity: loading ? 0.6 : 1,
        }}
        title="Change pipeline stage"
      >
        {ALL_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {STAGE_LABELS[stage] || stage}
          </option>
        ))}
      </select>
      {loading && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Updating...
        </span>
      )}
      {error && (
        <span className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

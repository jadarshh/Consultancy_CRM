"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PipelineClientFiltersProps {
  counselors: { id: string; firstName: string; lastName: string }[];
  currentSearch: string;
  currentCounselor: string;
}

export function PipelineClientFilters({
  counselors,
  currentSearch,
  currentCounselor,
}: PipelineClientFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/pipeline?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Text search */}
      <div className="relative flex-1">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          🔍
        </span>
        <input
          type="text"
          placeholder="Search students by name..."
          defaultValue={currentSearch}
          onChange={(e) => updateParam("q", e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Counselor filter */}
      {counselors.length > 0 && (
        <select
          defaultValue={currentCounselor}
          onChange={(e) => updateParam("counselor", e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="">All Counselors</option>
          {counselors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

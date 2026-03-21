"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Country {
  id: string;
  name: string;
  code: string;
  flagEmoji: string | null;
}

interface Program {
  id: string;
  name: string;
  level: string;
  field: string;
  durationMonths: number;
  tuitionFee: string;
  feeCurrency: string;
  scholarshipAvailable: boolean;
}

interface University {
  id: string;
  name: string;
  shortName: string | null;
  city: string;
  state: string | null;
  type: string;
  rankingGlobal: number | null;
  rankingNational: number | null;
  isPartner: boolean;
  commissionRate: string | null;
  website: string | null;
  country: Country;
  _count: { programs: number };
  programs?: Program[];
}

const emptyForm = {
  name: "",
  shortName: "",
  countryId: "",
  city: "",
  state: "",
  type: "PUBLIC",
  rankingGlobal: "",
  rankingNational: "",
  isPartner: false,
  commissionRate: "",
  website: "",
};

const TYPE_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  PRIVATE: "Private",
  COMMUNITY_COLLEGE: "Community College",
  INSTITUTE: "Institute",
  LANGUAGE_SCHOOL: "Language School",
};

const LEVEL_LABELS: Record<string, string> = {
  DIPLOMA: "Diploma",
  BACHELORS: "Bachelor's",
  MASTERS: "Master's",
  PHD: "PhD",
  CERTIFICATE: "Certificate",
  PATHWAY: "Pathway",
  FOUNDATION: "Foundation",
};

function UniversitiesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialCountryId = searchParams.get("countryId") || "";

  const [universities, setUniversities] = useState<University[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountryId, setFilterCountryId] = useState(initialCountryId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [programsCache, setProgramsCache] = useState<Record<string, Program[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, countryId: initialCountryId });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const canManage =
    session?.user.role === "ADMIN" || session?.user.role === "MANAGER";

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchUniversities();
  }, [filterCountryId]);

  async function fetchCountries() {
    try {
      const res = await fetch("/api/countries");
      const data = await res.json();
      setCountries(data);
    } catch {
      // ignore
    }
  }

  async function fetchUniversities() {
    setLoading(true);
    try {
      const url = filterCountryId
        ? `/api/universities?countryId=${filterCountryId}`
        : "/api/universities";
      const res = await fetch(url);
      const data = await res.json();
      setUniversities(data);
    } catch {
      setError("Failed to load universities");
    } finally {
      setLoading(false);
    }
  }

  async function loadPrograms(universityId: string) {
    if (programsCache[universityId]) return;
    try {
      const res = await fetch(`/api/universities/${universityId}/programs`);
      if (res.ok) {
        const data = await res.json();
        setProgramsCache((prev) => ({ ...prev, [universityId]: data }));
      } else {
        setProgramsCache((prev) => ({ ...prev, [universityId]: [] }));
      }
    } catch {
      setProgramsCache((prev) => ({ ...prev, [universityId]: [] }));
    }
  }

  async function toggleExpand(universityId: string) {
    if (expandedId === universityId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(universityId);
    await loadPrograms(universityId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create university");
        return;
      }
      setForm({ ...emptyForm, countryId: filterCountryId });
      setShowForm(false);
      fetchUniversities();
    } catch {
      setError("Failed to create university");
    } finally {
      setSaving(false);
    }
  }

  const filtered = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.shortName || "").toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountry = countries.find((c) => c.id === filterCountryId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Universities
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {selectedCountry
              ? `Showing universities in ${selectedCountry.flagEmoji || ""} ${selectedCountry.name}`
              : "All universities across all countries"}
          </p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add University"}
          </button>
        )}
      </div>

      {/* Add University Form */}
      {showForm && (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Add New University
          </h2>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  University Name *
                </label>
                <input
                  className="input-base"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. University of Melbourne"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Short Name
                </label>
                <input
                  className="input-base"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  placeholder="e.g. UoM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Country *
                </label>
                <select
                  className="input-base"
                  value={form.countryId}
                  onChange={(e) => setForm({ ...form, countryId: e.target.value })}
                  required
                >
                  <option value="">Select country...</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flagEmoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  City *
                </label>
                <input
                  className="input-base"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Melbourne"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  State / Province
                </label>
                <input
                  className="input-base"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Victoria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Type
                </label>
                <select
                  className="input-base"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Global Ranking
                </label>
                <input
                  className="input-base"
                  type="number"
                  value={form.rankingGlobal}
                  onChange={(e) => setForm({ ...form, rankingGlobal: e.target.value })}
                  placeholder="e.g. 33"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  National Ranking
                </label>
                <input
                  className="input-base"
                  type="number"
                  value={form.rankingNational}
                  onChange={(e) => setForm({ ...form, rankingNational: e.target.value })}
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Commission Rate (%)
                </label>
                <input
                  className="input-base"
                  type="number"
                  step="0.01"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Website
                </label>
                <input
                  className="input-base"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isPartner"
                  checked={form.isPartner}
                  onChange={(e) => setForm({ ...form, isPartner: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPartner" className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Partner University
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save University"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setError(""); setForm({ ...emptyForm, countryId: filterCountryId }); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <input
            className="input-base pl-9"
            placeholder="Search universities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "220px" }}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Country Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            className={`btn text-sm ${!filterCountryId ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilterCountryId("")}
          >
            All Countries
          </button>
          {countries.map((c) => (
            <button
              key={c.id}
              className={`btn text-sm ${filterCountryId === c.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterCountryId(c.id)}
            >
              {c.flagEmoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          Loading universities...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          No universities found.{canManage && " Click \"+ Add University\" to get started."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>University</th>
                <th>Country</th>
                <th>Type</th>
                <th>Ranking</th>
                <th>Status</th>
                <th>Programs</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((uni) => (
                <React.Fragment key={uni.id}>
                  <tr
                    className="cursor-pointer"
                    onClick={() => toggleExpand(uni.id)}
                  >
                    <td>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                            {uni.name}
                          </span>
                          {uni.isPartner && (
                            <span className="badge badge-info text-[10px]">Partner</span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {uni.city}{uni.state ? `, ${uni.state}` : ""}
                          {uni.shortName ? ` · ${uni.shortName}` : ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-base">{uni.country.flagEmoji || ""}</span>{" "}
                      <span className="text-sm">{uni.country.name}</span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {TYPE_LABELS[uni.type] || uni.type}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        {uni.rankingGlobal && (
                          <div style={{ color: "var(--text-primary)" }}>#{uni.rankingGlobal} Global</div>
                        )}
                        {uni.rankingNational && (
                          <div style={{ color: "var(--text-muted)" }}>#{uni.rankingNational} National</div>
                        )}
                        {!uni.rankingGlobal && !uni.rankingNational && (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {uni.isPartner ? (
                        <span className="badge badge-success">Partner</span>
                      ) : (
                        <span className="badge badge-neutral">Non-Partner</span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                        {uni._count.programs}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {uni.commissionRate ? `${uni.commissionRate}%` : "—"}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Programs Row */}
                  {expandedId === uni.id && (
                    <tr key={`${uni.id}-programs`}>
                      <td colSpan={7} style={{ background: "var(--background)", padding: "0" }}>
                        <div className="p-4">
                          <h4 className="font-medium text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                            Programs at {uni.name}
                          </h4>
                          {programsCache[uni.id] === undefined ? (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                              Loading programs...
                            </p>
                          ) : programsCache[uni.id].length === 0 ? (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                              No programs listed yet.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {programsCache[uni.id].map((prog) => (
                                <div
                                  key={prog.id}
                                  className="p-3 rounded-lg"
                                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                      {prog.name}
                                    </p>
                                    {prog.scholarshipAvailable && (
                                      <span className="badge badge-warning text-[10px] shrink-0">Scholarship</span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <span className="badge badge-primary text-[10px]">
                                      {LEVEL_LABELS[prog.level] || prog.level}
                                    </span>
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                      {prog.field}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                      {prog.durationMonths} months
                                    </span>
                                    <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                                      {prog.feeCurrency} {Number(prog.tuitionFee).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading...</div>}>
      <UniversitiesContent />
    </Suspense>
  );
}

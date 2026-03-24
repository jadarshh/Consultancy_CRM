"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { WORLD_COUNTRIES, codeToFlag, getContinent, CONTINENTS } from "@/lib/world-countries";

interface Country {
  id: string;
  name: string;
  code: string;
  flagEmoji: string | null;
  currency: string;
  workRights: string | null;
  postStudyWork: string | null;
  livingCostRange: string | null;
  healthInsuranceRequired: boolean;
  isActive: boolean;
  _count: {
    universities: number;
    requirements: number;
  };
}

const emptyForm = {
  name: "",
  code: "",
  flagEmoji: "",
  currency: "",
  continent: "",
  workRights: "",
  postStudyWork: "",
  livingCostRange: "",
  healthInsuranceRequired: false,
};

const CONTINENT_COLORS: Record<string, { bg: string; text: string }> = {
  Africa:       { bg: "#FEF3C7", text: "#92400E" },
  Americas:     { bg: "#DCFCE7", text: "#166534" },
  Asia:         { bg: "#FEE2E2", text: "#991B1B" },
  Europe:       { bg: "#DBEAFE", text: "#1E40AF" },
  "Middle East":{ bg: "#F3E8FF", text: "#6B21A8" },
  Oceania:      { bg: "#CCFBF1", text: "#0F766E" },
  Other:        { bg: "#F1F5F9", text: "#475569" },
};

export default function CountriesPage() {
  const { data: session } = useSession();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [continentFilter, setContinentFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [countrySearch, setCountrySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canManage =
    session?.user.role === "ADMIN" || session?.user.role === "MANAGER";

  useEffect(() => {
    fetchCountries();
  }, []);

  async function fetchCountries() {
    setLoading(true);
    try {
      const res = await fetch("/api/countries");
      const data = await res.json();
      setCountries(data);
    } catch {
      setError("Failed to load countries");
    } finally {
      setLoading(false);
    }
  }

  // Country picker logic
  const filteredWorldCountries = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return WORLD_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const groupedWorldCountries = useMemo(() => {
    const groups: Record<string, typeof WORLD_COUNTRIES> = {};
    for (const c of filteredWorldCountries) {
      if (!groups[c.continent]) groups[c.continent] = [];
      groups[c.continent].push(c);
    }
    return groups;
  }, [filteredWorldCountries]);

  function selectWorldCountry(wc: (typeof WORLD_COUNTRIES)[0]) {
    setForm((f) => ({
      ...f,
      name: wc.name,
      code: wc.code,
      flagEmoji: codeToFlag(wc.code),
      currency: wc.currency,
      continent: wc.continent,
    }));
    setCountrySearch(wc.name);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code) {
      setError("Please select a country from the dropdown.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create country");
        return;
      }
      setForm(emptyForm);
      setCountrySearch("");
      setShowForm(false);
      fetchCountries();
    } catch {
      setError("Failed to create country");
    } finally {
      setSaving(false);
    }
  }

  // Build list with derived continent
  const countriesWithContinent = useMemo(
    () =>
      countries.map((c) => ({
        ...c,
        continent: getContinent(c.code),
      })),
    [countries]
  );

  const availableContinents = useMemo(() => {
    const set = new Set(countriesWithContinent.map((c) => c.continent));
    return CONTINENTS.filter((c) => set.has(c));
  }, [countriesWithContinent]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return countriesWithContinent.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchesContinent =
        continentFilter === "All" || c.continent === continentFilter;
      return matchesSearch && matchesContinent;
    });
  }, [countriesWithContinent, search, continentFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Countries Catalog
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {countries.length} destination {countries.length === 1 ? "country" : "countries"} configured
          </p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setError(""); }}
          >
            {showForm ? "✕ Cancel" : "+ Add Country"}
          </button>
        )}
      </div>

      {/* Add Country Form */}
      {showForm && (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Add Destination Country
          </h2>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* Country Picker */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Select Country *
              </label>
              <div className="relative">
                <div className="relative">
                  {form.flagEmoji && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10">
                      {form.flagEmoji}
                    </span>
                  )}
                  <input
                    className="input-base"
                    style={{ paddingLeft: form.flagEmoji ? "2.75rem" : undefined }}
                    placeholder="Search countries by name, code, or continent..."
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setShowDropdown(true);
                      if (!e.target.value) {
                        setForm(emptyForm);
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    autoComplete="off"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showDropdown && countrySearch && (
                  <div
                    className="absolute z-50 w-full mt-1 rounded-xl shadow-xl border overflow-y-auto"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      maxHeight: "320px",
                    }}
                  >
                    {filteredWorldCountries.length === 0 ? (
                      <div className="p-4 text-sm text-center" style={{ color: "var(--text-muted)" }}>
                        No countries match &ldquo;{countrySearch}&rdquo;
                      </div>
                    ) : (
                      Object.entries(groupedWorldCountries).map(([continent, list]) => (
                        <div key={continent}>
                          <div
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest sticky top-0"
                            style={{
                              background: "var(--background)",
                              color: "var(--text-muted)",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            {continent}
                          </div>
                          {list.map((wc) => (
                            <button
                              key={wc.code}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--background)] transition-colors"
                              onClick={() => selectWorldCountry(wc)}
                            >
                              <span className="text-xl w-7 text-center flex-shrink-0">{codeToFlag(wc.code)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                  {wc.name}
                                </p>
                              </div>
                              <span className="text-xs font-mono ml-auto flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                                {wc.code} · {wc.currency}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Auto-filled preview */}
              {form.code && (
                <div
                  className="mt-3 flex items-center gap-4 p-3 rounded-xl text-sm"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                >
                  <span className="text-2xl">{form.flagEmoji}</span>
                  <div className="flex gap-4">
                    <span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Code </span>
                      <span className="font-mono font-bold text-xs" style={{ color: "var(--text-primary)" }}>{form.code}</span>
                    </span>
                    <span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Currency </span>
                      <span className="font-mono font-bold text-xs" style={{ color: "var(--text-primary)" }}>{form.currency}</span>
                    </span>
                    <span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Continent </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{form.continent}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CRM-specific fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Living Cost Range
                </label>
                <input
                  className="input-base"
                  value={form.livingCostRange}
                  onChange={(e) => setForm({ ...form, livingCostRange: e.target.value })}
                  placeholder="e.g. $1,500–$2,500/month"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="healthInsurance"
                  checked={form.healthInsuranceRequired}
                  onChange={(e) => setForm({ ...form, healthInsuranceRequired: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="healthInsurance" className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Health Insurance Required
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Work Rights
                </label>
                <input
                  className="input-base"
                  value={form.workRights}
                  onChange={(e) => setForm({ ...form, workRights: e.target.value })}
                  placeholder="e.g. 48 hours/fortnight during studies"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Post-Study Work
                </label>
                <input
                  className="input-base"
                  value={form.postStudyWork}
                  onChange={(e) => setForm({ ...form, postStudyWork: e.target.value })}
                  placeholder="e.g. 2–4 years post-study work visa"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" className="btn btn-primary" disabled={saving || !form.code}>
                {saving ? "Saving..." : "Save Country"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setError(""); setForm(emptyForm); setCountrySearch(""); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Continent Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            className="input-base pl-9"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Continent pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {["All", ...availableContinents].map((c) => (
            <button
              key={c}
              onClick={() => setContinentFilter(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                continentFilter === c
                  ? { background: "var(--primary)", color: "#fff" }
                  : { background: "var(--background)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
              }
            >
              {c}
            </button>
          ))}
        </div>

        <span className="text-sm self-center flex-shrink-0" style={{ color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "country" : "countries"}
        </span>
      </div>

      {/* Country Grid */}
      {loading ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          Loading countries...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          No countries found.{canManage && " Click \"+ Add Country\" to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((country) => {
            const flag = country.flagEmoji || codeToFlag(country.code) || "🌍";
            const contColor = CONTINENT_COLORS[country.continent] ?? CONTINENT_COLORS["Other"];
            return (
              <div
                key={country.id}
                className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: "var(--background)" }}
                    >
                      {flag}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight" style={{ color: "var(--text-primary)" }}>
                        {country.name}
                      </h3>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                        {country.code} · {country.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: contColor.bg, color: contColor.text }}
                    >
                      {country.continent}
                    </span>
                    {country._count.universities > 0 && (
                      <span className="badge badge-success text-[10px]">Partner</span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div
                  className="flex gap-4 py-3 mb-3"
                  style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex-1 text-center">
                    <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                      {country._count.universities}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Universities</p>
                  </div>
                  <div
                    className="w-px"
                    style={{ background: "var(--border)" }}
                  />
                  <div className="flex-1 text-center">
                    <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                      {country._count.requirements}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Requirements</p>
                  </div>
                  {country.healthInsuranceRequired && (
                    <>
                      <div className="w-px" style={{ background: "var(--border)" }} />
                      <div className="flex-1 text-center flex items-center justify-center">
                        <span className="badge badge-warning text-[10px]">Health Ins.</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {country.workRights && (
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold w-20 flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Work Rights
                      </span>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {country.workRights}
                      </p>
                    </div>
                  )}
                  {country.postStudyWork && (
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold w-20 flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Post-Study
                      </span>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {country.postStudyWork}
                      </p>
                    </div>
                  )}
                  {country.livingCostRange && (
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold w-20 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        Living Cost
                      </span>
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {country.livingCostRange}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <a
                    href={`/universities?countryId=${country.id}`}
                    className="btn btn-secondary w-full text-center text-sm"
                  >
                    View Universities →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
  currency: "USD",
  workRights: "",
  postStudyWork: "",
  livingCostRange: "",
  healthInsuranceRequired: false,
};

export default function CountriesPage() {
  const { data: session } = useSession();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      setShowForm(false);
      fetchCountries();
    } catch {
      setError("Failed to create country");
    } finally {
      setSaving(false);
    }
  }

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const hasPartnerUniversities = (country: Country) => country._count.universities > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Countries Catalog
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Manage destination countries and their requirements
          </p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Country"}
          </button>
        )}
      </div>

      {/* Add Country Form */}
      {showForm && (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Add New Country
          </h2>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Country Name *
                </label>
                <input
                  className="input-base"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Australia"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  2-Letter Code *
                </label>
                <input
                  className="input-base"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AU"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Flag Emoji
                </label>
                <input
                  className="input-base"
                  value={form.flagEmoji}
                  onChange={(e) => setForm({ ...form, flagEmoji: e.target.value })}
                  placeholder="e.g. 🇦🇺"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Currency
                </label>
                <input
                  className="input-base"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  placeholder="e.g. AUD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Living Cost Range
                </label>
                <input
                  className="input-base"
                  value={form.livingCostRange}
                  onChange={(e) => setForm({ ...form, livingCostRange: e.target.value })}
                  placeholder="e.g. $1,500-$2,500/mo"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="healthInsurance"
                  checked={form.healthInsuranceRequired}
                  onChange={(e) => setForm({ ...form, healthInsuranceRequired: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="healthInsurance" className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Health Insurance Required
                </label>
              </div>
              <div className="col-span-2 lg:col-span-3">
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
              <div className="col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Post-Study Work
                </label>
                <input
                  className="input-base"
                  value={form.postStudyWork}
                  onChange={(e) => setForm({ ...form, postStudyWork: e.target.value })}
                  placeholder="e.g. 2-4 years post-study work visa"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Country"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setError(""); setForm(emptyForm); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 items-center">
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
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
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
          {filtered.map((country) => (
            <div
              key={country.id}
              className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                setSelectedCountry(selectedCountry === country.id ? null : country.id)
              }
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl leading-none">{country.flagEmoji || "🌍"}</span>
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                      {country.name}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {country.code} · {country.currency}
                    </p>
                  </div>
                </div>
                {hasPartnerUniversities(country) && (
                  <span className="badge badge-success text-[10px]">Partner</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                    {country._count.universities}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Universities</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                    {country._count.requirements}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Requirements</p>
                </div>
                {country.healthInsuranceRequired && (
                  <div className="text-center">
                    <p className="text-xs mt-1">
                      <span className="badge badge-warning">Health Ins. Required</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                {country.workRights && (
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>
                      Work Rights
                    </p>
                    <p className="text-xs truncate-2" style={{ color: "var(--text-primary)" }}>
                      {country.workRights}
                    </p>
                  </div>
                )}
                {country.postStudyWork && (
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>
                      Post-Study Work
                    </p>
                    <p className="text-xs truncate-2" style={{ color: "var(--text-primary)" }}>
                      {country.postStudyWork}
                    </p>
                  </div>
                )}
                {country.livingCostRange && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Living Cost</p>
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {country.livingCostRange}
                    </p>
                  </div>
                )}
              </div>

              {/* View Universities Button */}
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <a
                  href={`/universities?countryId=${country.id}`}
                  className="btn btn-secondary w-full text-center text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Universities
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

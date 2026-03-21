"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, Eye, EyeOff, Award, TrendingUp, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F0F4F0" }}>
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex flex-col w-[55%] p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0A2D1F 0%, #1B4332 45%, #2D6A4F 100%)",
        }}
      >
        {/* Radial glow decorations */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,168,83,0.15), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,168,83,0.1), transparent 70%)" }}
        />

        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v40H0zm39 0h1v40h-1zM0 0v1h40V0zm0 39v1h40v-1z' fill='%23ffffff'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #D4A853, #B7791F)",
              boxShadow: "0 4px 20px rgba(212,168,83,0.5)",
            }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-xl tracking-tight">EduFlow</p>
            <p
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Consultancy Platform
            </p>
          </div>
        </div>

        {/* 3D Floating Cards — hero area */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-10">
          <div className="relative" style={{ width: "320px", height: "280px" }}>

            {/* Main card — pipeline overview */}
            <div
              className="animate-float3d absolute"
              style={{
                top: "20px",
                left: "0px",
                width: "300px",
                background: "rgba(255,255,255,0.09)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "20px",
                padding: "22px 24px",
                boxShadow: "0 40px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-sm">Student Pipeline</p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{ background: "rgba(212,168,83,0.25)", color: "#D4A853" }}
                >
                  Live
                </span>
              </div>
              {[
                { label: "Applications Submitted", value: 48, color: "#60A5FA", pct: 72 },
                { label: "Visa Processing", value: 23, color: "#D4A853", pct: 45 },
                { label: "Enrolled", value: 89, color: "#4ADE80", pct: 88 },
              ].map(({ label, value, color, pct }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {label}
                    </span>
                    <span className="text-[11px] font-bold text-white">{value}</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Top-right floating chip — students count */}
            <div
              className="animate-float3d-alt absolute"
              style={{
                top: "-10px",
                right: "-20px",
                background: "rgba(212,168,83,0.18)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(212,168,83,0.35)",
                borderRadius: "16px",
                padding: "14px 18px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(212,168,83,0.3)" }}
                >
                  <Award className="w-4 h-4" style={{ color: "#D4A853" }} />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-none">247</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Active Students
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom-left floating chip — success rate */}
            <div
              className="animate-float3d-slow absolute"
              style={{
                bottom: "-20px",
                left: "-10px",
                background: "rgba(74,222,128,0.12)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: "16px",
                padding: "14px 18px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(74,222,128,0.2)" }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: "#4ADE80" }} />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-none">94%</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Visa Success
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Empowering Global
            <br />
            <span style={{ color: "#D4A853" }}>Education Journeys</span>
          </h2>
          <div className="flex gap-6 mt-4">
            {[
              { value: "500+", label: "Students Placed" },
              { value: "50+", label: "Partner Universities" },
              { value: "15+", label: "Countries" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="px-4 py-2.5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <p className="text-lg font-bold text-white leading-none">{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: "#F0F4F0" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #D4A853, #B7791F)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl" style={{ color: "#1B4332" }}>
                EduFlow
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Consultancy Platform
              </p>
            </div>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: "#FFFFFF",
              boxShadow:
                "0 20px 60px rgba(27,67,50,0.1), 0 4px 16px rgba(27,67,50,0.06)",
              border: "1px solid rgba(27,67,50,0.08)",
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1B4332" }}>
                Welcome back
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Sign in to your EduFlow account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#1B4332" }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#1B4332" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-sm"
                  style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
                >
                  <span>⚠</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn w-full font-semibold mt-2"
                style={{
                  height: "44px",
                  background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
                  color: "white",
                  borderRadius: "10px",
                  fontSize: "15px",
                  boxShadow: "0 4px 16px rgba(27,67,50,0.45)",
                }}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  "Sign In →"
                )}
              </button>
            </form>

            {/* Feature list */}
            <div className="mt-6 pt-6 border-t space-y-2" style={{ borderColor: "rgba(27,67,50,0.08)" }}>
              {[
                "Student pipeline & visa tracking",
                "Document management & checklists",
                "Multi-role access control",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#1B4332" }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo credentials */}
          <div
            className="mt-4 p-3 rounded-xl text-xs flex items-center gap-2"
            style={{
              background: "#ECFDF5",
              color: "#1B4332",
              border: "1px solid #D1FAE5",
            }}
          >
            <span style={{ fontSize: "15px" }}>🔐</span>
            <div>
              <span className="font-semibold">Demo: </span>
              <span>admin@eduflow.com · Admin@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

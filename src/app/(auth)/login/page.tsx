"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, Eye, EyeOff, Globe } from "lucide-react";

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

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Deep Navy */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: "var(--primary)" }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #4A90D9 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #2A4A72 0%, transparent 40%)`,
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zm39 0h1v40h-1zM0 0v1h40V0zm0 39v1h40v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* World map decoration */}
        <div className="absolute bottom-0 left-0 right-0 opacity-5">
          <Globe className="w-full h-auto" style={{ width: "100%", color: "white" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-xl">EduFlow</p>
            <p className="text-white/60 text-xs">Consultancy Management System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Empowering Global
            <br />
            Education Journeys
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Streamline your consultancy workflow — manage students, track applications,
            and guide families to the right educational path.
          </p>

          {/* Stats */}
          <div className="flex gap-4 pt-4 flex-wrap">
            {[
              { value: "500+", label: "Students Placed" },
              { value: "50+", label: "Partner Universities" },
              { value: "15+", label: "Countries" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-white/40 text-sm">
          Trusted by education consultancies worldwide
        </p>
      </div>

      {/* Right Panel — White */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl p-8 space-y-6"
            style={{
              background: "var(--surface)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)" }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-xl" style={{ color: "var(--primary)" }}>EduFlow</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                Sign in to your EduFlow account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-sm"
                  style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
                >
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn w-full mt-2 font-semibold"
                style={{
                  height: "44px",
                  background: "linear-gradient(135deg, var(--primary), var(--accent))",
                  color: "white",
                  borderRadius: "10px",
                  fontSize: "15px",
                }}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Demo credentials hint */}
          <div
            className="mt-4 p-3 rounded-xl text-xs flex items-center gap-2"
            style={{ background: "var(--primary-50)", color: "var(--primary)", border: "1px solid var(--primary-100)" }}
          >
            <span style={{ fontSize: "16px" }}>🔐</span>
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

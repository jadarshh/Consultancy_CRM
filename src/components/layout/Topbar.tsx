"use client";

import { Search, Bell, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { initials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";

export function Topbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const user = session?.user;
  const nameParts = user?.name?.split(" ") ?? ["U", "U"];
  const userInitials = initials(nameParts[0] || "U", nameParts[nameParts.length - 1] || "U");

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 border-b"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search students, applications..."
            className="input-base pl-9 text-sm"
            style={{ height: "36px" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "var(--background)", color: "var(--text-secondary)" }}
        >
          <Bell className="w-4.5 h-4.5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--danger)" }}
          />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: menuOpen ? "var(--background)" : "transparent" }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                {userInitials}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>
                {user?.name?.split(" ")[0]}
              </p>
              <p className="text-[11px] leading-tight" style={{ color: "var(--text-muted)" }}>
                {ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 rounded-xl border py-1 animate-fade-in"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {user?.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {user?.email}
                </p>
              </div>
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => setMenuOpen(false)}
              >
                Profile Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors text-left"
                style={{ color: "var(--danger)" }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

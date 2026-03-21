"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Columns3,
  FileText,
  Phone,
  CheckSquare,
  Globe,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/communication", label: "Communication", icon: Phone },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/countries", label: "Countries", icon: Globe },
  { href: "/universities", label: "Universities", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger — shown in topbar area via absolute positioning */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: "var(--primary)", color: "white" }}
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect y="2" width="16" height="2" rx="1"/>
          <rect y="7" width="16" height="2" rx="1"/>
          <rect y="12" width="16" height="2" rx="1"/>
        </svg>
      </button>

    <aside
      className={cn(
        "sidebar flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-40",
        "hidden md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="font-bold text-white text-[15px] leading-tight tracking-tight">EduFlow</p>
            <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
              CRM Platform
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
                active && "active",
                collapsed && "justify-center"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div
        className="border-t border-white/10 p-2"
        style={{ background: "rgba(0,0,0,0.1)" }}
      >
        <div className="space-y-0.5">
          <Link
            href="/settings"
            className={cn(
              "sidebar-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
              pathname.startsWith("/settings") && "active",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-[var(--border)] shadow-sm flex items-center justify-center hover:bg-[var(--background)] transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "sidebar fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">EduFlow</p>
              <p className="text-[10px]" style={{ color: "var(--sidebar-text-muted)" }}>Consultancy CMS</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn("sidebar-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium", active && "active")}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
          <Link href="/settings" onClick={() => setMobileOpen(false)} className={cn("sidebar-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium", pathname.startsWith("/settings") && "active")}>
            <Settings className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Settings</span>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

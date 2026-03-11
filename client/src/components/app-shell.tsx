"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  UserCog,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("atlas-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("atlas-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [user?.role]);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/courses", label: "Courses", icon: BookOpen, show: true },
    { href: "/student/coursework", label: "Coursework", icon: ClipboardList, show: user?.role === "student" },
    { href: "/student/enrollments", label: "Enrollments", icon: GraduationCap, show: user?.role === "student" },
    { href: "/student/activity", label: "Activity", icon: Activity, show: user?.role === "student" },
    { href: "/student/notifications", label: "Notifications", icon: Bell, show: user?.role === "student" },
    { href: "/instructor/courses", label: "Instructor", icon: UserCog, show: user?.role === "instructor" || user?.role === "admin" },
    { href: "/instructor/analytics", label: "Analytics", icon: BarChart3, show: user?.role === "instructor" || user?.role === "admin" },
    { href: "/instructor/activity", label: "Instructor Activity", icon: Activity, show: user?.role === "instructor" || user?.role === "admin" },
    { href: "/admin/analytics", label: "Admin", icon: Shield, show: user?.role === "admin" },
  ].filter((link) => link.show);

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-blob-1 absolute left-[-20%] top-[-10%] h-[320px] w-[320px] rounded-full blur-[120px]" />
        <div className="bg-blob-2 absolute right-[-15%] top-[10%] h-[380px] w-[380px] rounded-full blur-[140px]" />
        <div className="bg-blob-3 absolute bottom-[-20%] left-[20%] h-[420px] w-[420px] rounded-full blur-[160px]" />
      </div>
      <header className="app-shell-header sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link className="flex items-center gap-2.5 font-display text-lg sm:text-xl" href="/">
            <span className="app-shell-logo inline-flex h-8 w-8 items-center justify-center rounded-full text-sm sm:h-9 sm:w-9 sm:text-base">
              A
            </span>
            Atlas LMS
          </Link>

          <nav className="hidden items-center gap-3 text-sm md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} className="app-shell-link inline-flex items-center gap-1.5" href={link.href}>
                <link.icon size={15} strokeWidth={2} />
                <span>{link.label}</span>
              </Link>
            ))}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <span className="app-shell-pill rounded-full px-3 py-1 text-[11px]">
                Instructor view
              </span>
            ) : null}
            {mounted ? (
              <button
                className="app-shell-pill rounded-full px-3 py-1 text-[11px] inline-flex items-center gap-1.5"
                type="button"
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                {theme === "dark" ? "Light theme" : "Dark theme"}
              </button>
            ) : null}
            {loading ? (
              <span className="app-shell-link">Checking...</span>
            ) : user ? (
              <button
                className="app-shell-pill rounded-full px-4 py-1 text-xs inline-flex items-center gap-1.5"
                type="button"
                onClick={() => void logout()}
              >
                <LogOut size={14} />
                Sign out
              </button>
            ) : (
              <Link className="rounded-full px-4 py-1 text-xs font-semibold ui-btn-primary inline-flex items-center gap-1.5" href="/login">
                <LogIn size={14} />
                Sign in
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            {mounted ? (
              <button
                className="app-shell-pill rounded-full px-3 py-1.5 text-[11px] inline-flex items-center gap-1"
                type="button"
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            ) : null}
            <button
              className="app-shell-pill rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1"
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] px-4 pb-4 pt-3 md:hidden">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                  className="app-shell-link app-shell-pill rounded-xl px-4 py-3 text-sm inline-flex items-center gap-2"
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon size={16} strokeWidth={2} />
                  {link.label}
                </Link>
              ))}

              {loading ? (
                <span className="app-shell-link app-shell-pill rounded-xl px-4 py-3 text-sm">Checking...</span>
              ) : user ? (
                <button
                  className="app-shell-pill rounded-xl px-4 py-3 text-left text-sm inline-flex items-center gap-2"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              ) : (
                <Link
                  className="ui-btn-primary rounded-xl px-4 py-3 text-center text-sm font-semibold inline-flex items-center justify-center gap-2"
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn size={16} />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

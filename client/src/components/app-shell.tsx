"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("atlas-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("atlas-theme", theme);
  }, [theme, mounted]);

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-blob-1 absolute left-[-20%] top-[-10%] h-[320px] w-[320px] rounded-full blur-[120px]" />
        <div className="bg-blob-2 absolute right-[-15%] top-[10%] h-[380px] w-[380px] rounded-full blur-[140px]" />
        <div className="bg-blob-3 absolute bottom-[-20%] left-[20%] h-[420px] w-[420px] rounded-full blur-[160px]" />
      </div>
      <header className="app-shell-header sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="flex items-center gap-3 font-display text-xl" href="/">
            <span className="app-shell-logo inline-flex h-9 w-9 items-center justify-center rounded-full">
              A
            </span>
            Atlas LMS
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link className="app-shell-link" href="/dashboard">
              Dashboard
            </Link>
            <Link className="app-shell-link" href="/courses">
              Courses
            </Link>
            {user?.role === "student" ? (
              <Link className="app-shell-link" href="/student/coursework">
                Coursework
              </Link>
            ) : null}
            {user?.role === "student" ? (
              <Link className="app-shell-link" href="/student/enrollments">
                Enrollments
              </Link>
            ) : null}
            {user?.role === "student" ? (
              <Link className="app-shell-link" href="/student/activity">
                Activity
              </Link>
            ) : null}
            {user?.role === "student" ? (
              <Link className="app-shell-link" href="/student/notifications">
                Notifications
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <Link className="app-shell-link" href="/instructor/courses">
                Instructor
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <Link className="app-shell-link" href="/instructor/analytics">
                Analytics
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <Link className="app-shell-link" href="/instructor/activity">
                Activity
              </Link>
            ) : null}
            {user?.role === "admin" ? (
              <Link className="app-shell-link" href="/admin/analytics">
                Admin
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <span className="app-shell-pill rounded-full px-3 py-1 text-[11px]">
                Instructor view
              </span>
            ) : null}
            {mounted ? (
              <button
                className="app-shell-pill rounded-full px-3 py-1 text-[11px]"
                type="button"
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? "Light theme" : "Dark theme"}
              </button>
            ) : null}
            {loading ? (
              <span className="app-shell-link">Checking...</span>
            ) : user ? (
              <button
                className="app-shell-pill rounded-full px-4 py-1 text-xs"
                type="button"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            ) : (
              <Link className="rounded-full px-4 py-1 text-xs font-semibold ui-btn-primary" href="/login">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-20%] top-[-10%] h-[320px] w-[320px] rounded-full bg-amber-400/20 blur-[120px]" />
        <div className="absolute right-[-15%] top-[10%] h-[380px] w-[380px] rounded-full bg-orange-500/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-[160px]" />
      </div>
      <header className="sticky top-0 z-20 border-b border-slate-900/70 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="flex items-center gap-3 font-display text-xl" href="/">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950">
              A
            </span>
            Atlas LMS
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link className="text-slate-200 hover:text-white" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-slate-300 hover:text-white" href="/courses">
              Courses
            </Link>
            {user?.role === "student" ? (
              <Link className="text-slate-300 hover:text-white" href="/student/coursework">
                Coursework
              </Link>
            ) : null}
            {user?.role === "student" ? (
              <Link className="text-slate-300 hover:text-white" href="/student/enrollments">
                Enrollments
              </Link>
            ) : null}
            {user?.role === "student" ? (
              <Link className="text-slate-300 hover:text-white" href="/student/activity">
                Activity
              </Link>
            ) : null}
            {user?.role === "student" ? (
              <Link className="text-slate-300 hover:text-white" href="/student/notifications">
                Notifications
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <Link className="text-slate-300 hover:text-white" href="/instructor/courses">
                Instructor
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <Link className="text-slate-300 hover:text-white" href="/instructor/analytics">
                Analytics
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <Link className="text-slate-300 hover:text-white" href="/instructor/activity">
                Activity
              </Link>
            ) : null}
            {user?.role === "admin" ? (
              <Link className="text-slate-300 hover:text-white" href="/admin/analytics">
                Admin
              </Link>
            ) : null}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <span className="rounded-full border border-slate-700/80 px-3 py-1 text-[11px] text-slate-300">
                Instructor view
              </span>
            ) : null}
            {loading ? (
              <span className="text-slate-500">Checking...</span>
            ) : user ? (
              <button
                className="rounded-full border border-slate-700/80 px-4 py-1 text-xs text-slate-100"
                type="button"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            ) : (
              <Link className="rounded-full bg-amber-400 px-4 py-1 text-xs font-semibold text-slate-950" href="/login">
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

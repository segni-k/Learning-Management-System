"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900/80 bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link className="text-sm font-semibold uppercase tracking-[0.3em]" href="/">
            LMS Client
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-slate-300 hover:text-slate-100" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-slate-300 hover:text-slate-100" href="/courses/1">
              Course Detail
            </Link>
            {user?.role === "instructor" || user?.role === "admin" ? (
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                Instructor view
              </span>
            ) : null}
            {loading ? (
              <span className="text-slate-500">Checking...</span>
            ) : user ? (
              <button
                className="rounded-full border border-slate-700 px-4 py-1 text-xs text-slate-200"
                type="button"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            ) : (
              <Link className="text-lime-300" href="/login">
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

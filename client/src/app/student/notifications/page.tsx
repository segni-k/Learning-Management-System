"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listStudentNotifications } from "@/lib/student";
import type { StudentNotifications } from "@/lib/types";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<StudentNotifications | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listStudentNotifications();
        setNotifications(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load notifications");
      }
    };

    void load();
  }, []);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="text-sm text-slate-400">Upcoming deadlines and new content.</p>
          <Link className="text-xs text-amber-300" href="/dashboard">
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Upcoming assignments</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.upcoming_assignments ?? []).map((item) => (
                <div key={`assignment-${item.id}`} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">Due {item.due_at ?? "-"}</p>
                </div>
              ))}
              {!(notifications?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">New lessons</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_lessons ?? []).map((item) => (
                <div key={`lesson-${item.id}`} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">Added {item.created_at ?? "-"}</p>
                </div>
              ))}
              {!(notifications?.new_lessons ?? []).length && (
                <p className="text-sm text-slate-400">No new lessons.</p>
              )}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">New quizzes</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_quizzes ?? []).map((item) => (
                <div key={`quiz-${item.id}`} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">Added {item.created_at ?? "-"}</p>
                </div>
              ))}
              {!(notifications?.new_quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No new quizzes.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

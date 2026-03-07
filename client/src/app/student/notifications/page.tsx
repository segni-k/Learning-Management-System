"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listStudentNotifications } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
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
          <Panel>
            <h2 className="text-lg font-semibold">Upcoming assignments</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.upcoming_assignments ?? []).map((item) => (
                <Card key={`assignment-${item.id}`} className="p-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">Due {item.due_at ?? "-"}</p>
                </Card>
              ))}
              {!(notifications?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">New lessons</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_lessons ?? []).map((item) => (
                <Card key={`lesson-${item.id}`} className="p-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">Added {item.created_at ?? "-"}</p>
                </Card>
              ))}
              {!(notifications?.new_lessons ?? []).length && (
                <p className="text-sm text-slate-400">No new lessons.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">New quizzes</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_quizzes ?? []).map((item) => (
                <Card key={`quiz-${item.id}`} className="p-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">Added {item.created_at ?? "-"}</p>
                </Card>
              ))}
              {!(notifications?.new_quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No new quizzes.</p>
              )}
            </div>
          </Panel>
        </section>
      </main>
    </RequireAuth>
  );
}

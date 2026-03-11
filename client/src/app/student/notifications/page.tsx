"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, ClipboardList, FileQuestion } from "lucide-react";
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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
            <Bell size={22} /> Notifications
          </h1>
          <p className="text-sm text-slate-400">Upcoming deadlines and new content.</p>
          <Link className="inline-flex items-center gap-1 text-xs text-amber-300" href="/dashboard">
            <ClipboardList size={14} />
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-3">
          <Panel>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><ClipboardList size={18} /> Upcoming assignments</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.upcoming_assignments ?? []).map((item) => (
                <Link key={`assignment-${item.id}`} href={item.course?.id ? `/courses/${item.course.id}` : "/dashboard"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">Due {item.due_at ?? "-"}</p>
                  </Card>
                </Link>
              ))}
              {!(notifications?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><BookOpen size={18} /> New lessons</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_lessons ?? []).map((item) => (
                <Link key={`lesson-${item.id}`} href={item.course?.id ? `/courses/${item.course.id}` : "/dashboard"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">Added {item.created_at ?? "-"}</p>
                  </Card>
                </Link>
              ))}
              {!(notifications?.new_lessons ?? []).length && (
                <p className="text-sm text-slate-400">No new lessons.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><FileQuestion size={18} /> New quizzes</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_quizzes ?? []).map((item) => (
                <Link key={`quiz-${item.id}`} href={item.course?.id ? `/courses/${item.course.id}` : "/dashboard"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">Added {item.created_at ?? "-"}</p>
                  </Card>
                </Link>
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

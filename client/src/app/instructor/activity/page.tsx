"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/require-role";
import { listInstructorActivity } from "@/lib/activity";
import type { StudentActivity } from "@/lib/types";

export default function InstructorActivityPage() {
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listInstructorActivity({
          submissions_per_page: 10,
          attempts_per_page: 10,
        });
        setActivity(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load activity");
      }
    };

    void load();
  }, []);

  return (
    <RequireRole roles={["instructor", "admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Instructor</p>
          <h1 className="text-3xl font-semibold">Recent activity</h1>
          <p className="text-sm text-slate-400">Latest submissions and quiz attempts.</p>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Submissions</h2>
            <div className="mt-4 space-y-3">
              {(activity?.assignment_submissions ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{item.assignment?.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.student?.name ?? "Student"} · {item.course?.title}
                  </p>
                  <p className="text-xs text-slate-500">Submitted {item.submitted_at}</p>
                </div>
              ))}
              {!(activity?.assignment_submissions ?? []).length && (
                <p className="text-sm text-slate-400">No submissions yet.</p>
              )}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Quiz attempts</h2>
            <div className="mt-4 space-y-3">
              {(activity?.quiz_attempts ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{item.quiz?.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.student?.name ?? "Student"} · {item.course?.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    Score {item.score ?? "-"} · {item.completed_at}
                  </p>
                </div>
              ))}
              {!(activity?.quiz_attempts ?? []).length && (
                <p className="text-sm text-slate-400">No attempts yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </RequireRole>
  );
}

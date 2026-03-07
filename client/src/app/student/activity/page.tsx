"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listStudentActivity } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StudentActivity } from "@/lib/types";

export default function StudentActivityPage() {
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [attemptsPage, setAttemptsPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listStudentActivity({
          submissions_page: submissionsPage,
          attempts_page: attemptsPage,
          submissions_per_page: 8,
          attempts_per_page: 8,
        });
        setActivity(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load activity");
      }
    };

    void load();
  }, [submissionsPage, attemptsPage]);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="text-3xl font-semibold">Activity</h1>
          <p className="text-sm text-slate-400">Your submissions and quiz attempts.</p>
          <Link className="text-xs text-amber-300" href="/dashboard">
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assignment submissions</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setSubmissionsPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setSubmissionsPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(activity?.assignment_submissions ?? []).map((item) => (
                <Card key={item.id} className="p-3">
                  <p className="text-sm font-semibold">{item.assignment?.title}</p>
                  <p className="text-xs text-slate-500">Submitted {item.submitted_at}</p>
                  <p className="text-xs text-slate-500">Score {item.score ?? "-"}</p>
                </Card>
              ))}
              {!(activity?.assignment_submissions ?? []).length && (
                <p className="text-sm text-slate-400">No submissions yet.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quiz attempts</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setAttemptsPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setAttemptsPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(activity?.quiz_attempts ?? []).map((item) => (
                <Card key={item.id} className="p-3">
                  <p className="text-sm font-semibold">{item.quiz?.title}</p>
                  <p className="text-xs text-slate-500">Completed {item.completed_at}</p>
                  <p className="text-xs text-slate-500">Score {item.score ?? "-"}</p>
                </Card>
              ))}
              {!(activity?.quiz_attempts ?? []).length && (
                <p className="text-sm text-slate-400">No attempts yet.</p>
              )}
            </div>
          </Panel>
        </section>
      </main>
    </RequireAuth>
  );
}

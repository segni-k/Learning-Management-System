"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/require-role";
import { listInstructorActivity } from "@/lib/activity";
import { SectionHeader } from "@/components/ui/section-header";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeader
          eyebrow="Instructor"
          title="Recent activity"
          description="Latest submissions and quiz attempts."
        />

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <h2 className="text-lg font-semibold">Submissions</h2>
            <div className="mt-4 space-y-3">
              {(activity?.assignment_submissions ?? []).map((item) => (
                <Card key={item.id} className="p-3">
                  <p className="text-sm font-semibold">{item.assignment?.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.student?.name ?? "Student"} · {item.course?.title}
                  </p>
                  <p className="text-xs text-slate-500">Submitted {item.submitted_at}</p>
                </Card>
              ))}
              {!(activity?.assignment_submissions ?? []).length && (
                <p className="text-sm text-slate-400">No submissions yet.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">Quiz attempts</h2>
            <div className="mt-4 space-y-3">
              {(activity?.quiz_attempts ?? []).map((item) => (
                <Card key={item.id} className="p-3">
                  <p className="text-sm font-semibold">{item.quiz?.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.student?.name ?? "Student"} · {item.course?.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    Score {item.score ?? "-"} · {item.completed_at}
                  </p>
                </Card>
              ))}
              {!(activity?.quiz_attempts ?? []).length && (
                <p className="text-sm text-slate-400">No attempts yet.</p>
              )}
            </div>
          </Panel>
        </section>
      </main>
    </RequireRole>
  );
}

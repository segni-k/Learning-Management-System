"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listEnrollments } from "@/lib/enrollments";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import type { Enrollment } from "@/lib/types";

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listEnrollments();
        setEnrollments(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load enrollments");
      }
    };

    void load();
  }, []);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="text-3xl font-semibold">My enrollments</h1>
          <p className="text-sm text-slate-400">All courses you are enrolled in.</p>
          <Link className="text-xs text-amber-300" href="/dashboard">
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="p-4">
                <p className="text-sm font-semibold">{enrollment.course?.title}</p>
                <p className="text-xs text-slate-500">Status {enrollment.status}</p>
                <p className="text-xs text-slate-500">Enrolled {enrollment.enrolled_at}</p>
              </Card>
            ))}
            {!enrollments.length && (
              <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/60 p-5">
                <p className="text-sm text-slate-200">No enrollments yet.</p>
                <p className="mt-2 text-xs text-slate-400">
                  Head to the course catalog to enroll.
                </p>
                <Link className="mt-3 inline-flex text-xs text-amber-300" href="/courses">
                  Browse courses
                </Link>
              </div>
            )}
          </div>
        </Panel>
      </main>
    </RequireAuth>
  );
}

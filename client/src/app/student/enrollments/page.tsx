"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listEnrollments } from "@/lib/enrollments";
import { getStudentOverview } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Enrollment } from "@/lib/types";
import type { StudentDashboardCourse } from "@/lib/types";

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<number, StudentDashboardCourse>>({});
  const [status, setStatus] = useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [enrollmentsResponse, overviewResponse] = await Promise.all([
          listEnrollments(),
          getStudentOverview(),
        ]);

        setEnrollments(enrollmentsResponse.data);
        setCourseProgress(
          Object.fromEntries(
            (overviewResponse.data.courses ?? []).map((course) => [course.id, course])
          )
        );
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
          <h1 className="text-3xl font-semibold">My learning</h1>
          <p className="text-sm text-slate-400">
            Continue your enrolled courses, track completion, and jump back into lessons.
          </p>
          <Link className="text-xs text-amber-300" href="/dashboard">
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Enrolled courses</h2>
            <Link className="text-xs text-amber-300" href="/courses">
              Browse catalog
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={enrollment.course_id ? `/courses/${enrollment.course_id}` : "/courses"}
                className="block"
              >
                <Card className="p-4 transition hover:border-slate-700/90">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{enrollment.course?.title ?? "Untitled course"}</p>
                    <Badge>{enrollment.completed_at ? "completed" : enrollment.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Instructor {enrollment.course?.instructor?.name ?? "TBA"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Enrolled {formatDate(enrollment.enrolled_at)}</p>
                  <p className="text-xs text-slate-500">
                    Completion {Math.round(courseProgress[enrollment.course_id]?.completion_percent ?? 0)}%
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${Math.min(
                          Math.max(courseProgress[enrollment.course_id]?.completion_percent ?? 0, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs font-medium text-amber-300">
                    {enrollment.completed_at ? "Review course" : "Continue learning"}
                  </p>
                </Card>
              </Link>
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

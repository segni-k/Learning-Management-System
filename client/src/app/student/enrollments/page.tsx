"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listEnrollments } from "@/lib/enrollments";
import { getStudentOverview } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import type { Enrollment } from "@/lib/types";

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [overviewByCourse, setOverviewByCourse] = useState<
    Record<number, { completed_lessons: number; total_lessons: number; completion_percent: number }>
  >({});
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

        const nextOverviewByCourse = (overviewResponse.data.courses ?? []).reduce<
          Record<number, { completed_lessons: number; total_lessons: number; completion_percent: number }>
        >((acc, course) => {
          const completionPercent = course.total_lessons > 0
            ? Math.round((course.completed_lessons / course.total_lessons) * 100)
            : 0;
          acc[course.id] = {
            completed_lessons: course.completed_lessons,
            total_lessons: course.total_lessons,
            completion_percent: completionPercent,
          };
          return acc;
        }, {});

        setOverviewByCourse(nextOverviewByCourse);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load enrollments");
      }
    };

    void load();
  }, []);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
        <header className="space-y-2 px-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">My Learning</h1>
          <p className="text-sm text-slate-400">Continue from your enrolled courses.</p>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Enrolled courses</p>
            <Link className="text-xs text-amber-300" href="/dashboard">
              Back to dashboard
            </Link>
          </div>

          <div className="grid gap-3">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={enrollment.course_id ? `/courses/${enrollment.course_id}` : "/courses"}
                className="block"
              >
                <Card className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold sm:text-lg">{enrollment.course?.title ?? "Course"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Enrolled {formatDate(enrollment.enrolled_at)}
                      </p>
                    </div>
                    <span className="ui-badge rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
                      {enrollment.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-slate-500">
                      Progress {overviewByCourse[enrollment.course_id]?.completed_lessons ?? 0}/
                      {overviewByCourse[enrollment.course_id]?.total_lessons ?? 0} lessons
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/70">
                      <div
                        className="h-full rounded-full ui-btn-primary"
                        style={{ width: `${Math.min(Math.max(overviewByCourse[enrollment.course_id]?.completion_percent ?? 0, 0), 100)}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs font-medium text-amber-300">Open course</p>
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

"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/require-role";
import {
  getInstructorAnalyticsCourses,
  getInstructorAnalyticsOverview,
} from "@/lib/analytics";
import {
  instructorAttemptsExportUrl,
  instructorSubmissionsExportUrl,
} from "@/lib/exports";
import type { AnalyticsCourseRow, AnalyticsOverview } from "@/lib/types";

export default function InstructorAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<AnalyticsCourseRow[]>([]);
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewResponse, coursesResponse] = await Promise.all([
          getInstructorAnalyticsOverview(),
          getInstructorAnalyticsCourses(),
        ]);
        setOverview(overviewResponse.data);
        setCourses(coursesResponse.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load analytics");
      }
    };

    void load();
  }, []);

  return (
    <RequireRole roles={["instructor", "admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Instructor</p>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-sm text-slate-400">Overview of course performance and exports.</p>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        {overview ? (
          <section className="grid gap-4 md:grid-cols-4">
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Courses</p>
              <p className="text-2xl font-semibold">{overview.courses_total}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Published</p>
              <p className="text-2xl font-semibold">{overview.courses_published}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Enrollments</p>
              <p className="text-2xl font-semibold">{overview.enrollments_total}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completion</p>
              <p className="text-2xl font-semibold">{overview.completion_rate}%</p>
            </div>
          </section>
        ) : null}

        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Exports</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs text-slate-400">
              Course ID (optional)
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                placeholder="Course ID"
              />
            </label>
            <a
              className="rounded-full border border-slate-700/80 px-4 py-2 text-xs"
              href={instructorSubmissionsExportUrl({
                course_id: courseId ? Number(courseId) : undefined,
              })}
            >
              Download submissions CSV
            </a>
            <a
              className="rounded-full border border-slate-700/80 px-4 py-2 text-xs"
              href={instructorAttemptsExportUrl({
                course_id: courseId ? Number(courseId) : undefined,
              })}
            >
              Download attempts CSV
            </a>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Course breakdown</h2>
          <div className="mt-4 space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{course.title}</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {course.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Enrollments {course.enrollments} · Avg progress {course.average_progress}%
                </p>
              </div>
            ))}
            {!courses.length && <p className="text-sm text-slate-400">No courses yet.</p>}
          </div>
        </section>
      </main>
    </RequireRole>
  );
}

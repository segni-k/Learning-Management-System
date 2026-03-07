"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/require-role";
import { getAdminAnalyticsCourses, getAdminAnalyticsOverview } from "@/lib/analytics";
import { adminEnrollmentsExportUrl, adminProgressExportUrl } from "@/lib/exports";
import { SectionHeader } from "@/components/ui/section-header";
import { Stat } from "@/components/ui/stat";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsCourseRow, AnalyticsOverview } from "@/lib/types";

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<AnalyticsCourseRow[]>([]);
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewResponse, coursesResponse] = await Promise.all([
          getAdminAnalyticsOverview(),
          getAdminAnalyticsCourses(),
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
    <RequireRole roles={["admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeader
          eyebrow="Admin"
          title="Analytics"
          description="Platform-wide metrics and exports."
        />

        {status && <p className="text-sm text-rose-300">{status}</p>}

        {overview ? (
          <section className="grid gap-4 md:grid-cols-5">
            <Stat label="Courses" value={overview.courses_total} />
            <Stat label="Published" value={overview.courses_published} />
            <Stat label="Students" value={overview.students_total ?? 0} />
            <Stat label="Instructors" value={overview.instructors_total ?? 0} />
            <Stat label="Completion" value={`${overview.completion_rate}%`} />
          </section>
        ) : null}

        <Panel>
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
              className="rounded-full border border-slate-700 px-4 py-2 text-xs"
              href={adminEnrollmentsExportUrl({ course_id: courseId ? Number(courseId) : undefined })}
            >
              Download enrollments CSV
            </a>
            <a
              className="rounded-full border border-slate-700 px-4 py-2 text-xs"
              href={adminProgressExportUrl({ course_id: courseId ? Number(courseId) : undefined })}
            >
              Download progress CSV
            </a>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold">Course breakdown</h2>
          <div className="mt-4 space-y-3">
            {courses.map((course) => (
              <Card key={course.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{course.title}</p>
                  <Badge>{course.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Enrollments {course.enrollments} · Avg progress {course.average_progress}%
                </p>
                <p className="text-xs text-slate-500">
                  Instructor {course.instructor?.name ?? "-"}
                </p>
              </Card>
            ))}
            {!courses.length && <p className="text-sm text-slate-400">No courses yet.</p>}
          </div>
        </Panel>
      </main>
    </RequireRole>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { getStudentCourseDashboard } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import type { StudentCourseDashboard } from "@/lib/types";

export default function StudentCourseDashboardPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [dashboard, setDashboard] = useState<StudentCourseDashboard | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    const load = async () => {
      try {
        const response = await getStudentCourseDashboard(id);
        setDashboard(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load course dashboard");
      }
    };

    void load();
  }, [id]);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Course dashboard</p>
          <h1 className="text-3xl font-semibold">{dashboard?.course.title ?? "Course"}</h1>
          <p className="text-sm text-slate-400">Progress and upcoming work.</p>
          <Link className="text-xs text-amber-300" href={`/courses/${id}`}>
            Back to course
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        {dashboard ? (
          <section className="grid gap-4 md:grid-cols-3">
            <Panel className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lessons</p>
              <p className="text-2xl font-semibold">
                {dashboard.progress.completed_lessons}/{dashboard.progress.total_lessons}
              </p>
            </Panel>
            <Panel className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Avg progress</p>
              <p className="text-2xl font-semibold">{dashboard.progress.average_progress}%</p>
            </Panel>
            <Panel className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="text-2xl font-semibold">{dashboard.course.status}</p>
            </Panel>
          </section>
        ) : null}

        {dashboard?.resume_lesson ? (
          <Panel>
            <h2 className="text-lg font-semibold">Resume lesson</h2>
            <Card className="mt-3">
              <p className="text-sm font-semibold">{dashboard.resume_lesson.lesson?.title}</p>
              <p className="text-xs text-slate-500">
                {dashboard.resume_lesson.module?.title} · {dashboard.resume_lesson.progress_percent}%
              </p>
            </Card>
          </Panel>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <h2 className="text-lg font-semibold">Upcoming assignments</h2>
            <div className="mt-4 space-y-3">
              {(dashboard?.upcoming_assignments ?? []).map((assignment) => (
                <Card key={assignment.id} className="p-3">
                  <p className="text-sm font-semibold">{assignment.title}</p>
                  <p className="text-xs text-slate-500">Due {assignment.due_at}</p>
                </Card>
              ))}
              {!(dashboard?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">Recent quizzes</h2>
            <div className="mt-4 space-y-3">
              {(dashboard?.recent_quizzes ?? []).map((quiz) => (
                <Card key={quiz.id} className="p-3">
                  <p className="text-sm font-semibold">{quiz.title}</p>
                  <p className="text-xs text-slate-500">Attempts {quiz.max_attempts ?? "-"}</p>
                </Card>
              ))}
              {!(dashboard?.recent_quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No recent quizzes.</p>
              )}
            </div>
          </Panel>
        </section>

        <Panel>
          <h2 className="text-lg font-semibold">Module progress</h2>
          <div className="mt-4 space-y-3">
            {(dashboard?.modules ?? []).map((module) => (
              <Card key={module.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{module.title}</p>
                  <p className="text-xs text-slate-500">
                    {module.completed_lessons}/{module.total_lessons}
                  </p>
                </div>
                <p className="text-xs text-slate-500">Avg {module.average_progress}%</p>
              </Card>
            ))}
            {!(dashboard?.modules ?? []).length && (
              <p className="text-sm text-slate-400">No module data yet.</p>
            )}
          </div>
        </Panel>
      </main>
    </RequireAuth>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ClipboardList, Filter, ListChecks } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { listStudentCoursework } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StudentCoursework } from "@/lib/types";

export default function StudentCourseworkPage() {
  const searchParams = useSearchParams();
  const [coursework, setCoursework] = useState<StudentCoursework | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState(searchParams.get("assignments_status") ?? "");
  const [quizStatus, setQuizStatus] = useState(searchParams.get("quiz_status") ?? "");
  const [dueFrom, setDueFrom] = useState(searchParams.get("due_from") ?? "");
  const [dueTo, setDueTo] = useState(searchParams.get("due_to") ?? "");
  const [courseIdFilter, setCourseIdFilter] = useState(searchParams.get("course_id") ?? "");
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [quizzesPage, setQuizzesPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listStudentCoursework({
          course_id: courseIdFilter ? Number(courseIdFilter) : undefined,
          assignments_status: assignmentStatus || undefined,
          quiz_status: quizStatus || undefined,
          due_from: dueFrom || undefined,
          due_to: dueTo || undefined,
          assignments_page: assignmentsPage,
          quizzes_page: quizzesPage,
          assignments_per_page: 8,
          quizzes_per_page: 8,
        });
        setCoursework(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load coursework");
      }
    };

    void load();
  }, [courseIdFilter, assignmentStatus, quizStatus, dueFrom, dueTo, assignmentsPage, quizzesPage]);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
            <ClipboardList size={22} /> Coursework
          </h1>
          <p className="text-sm text-slate-400">Filter assignments and quiz availability.</p>
          <Link className="inline-flex items-center gap-1 text-xs text-amber-300" href="/dashboard">
            <ListChecks size={14} />
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <Panel>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <Filter size={18} /> Filters
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="grid gap-2 text-xs text-slate-400">
              Course ID
              <input
                className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs"
                type="number"
                min={1}
                value={courseIdFilter}
                onChange={(event) => setCourseIdFilter(event.target.value)}
                placeholder="All"
              />
            </label>
            <label className="grid gap-2 text-xs text-slate-400">
              Assignment status
              <select
                className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs"
                value={assignmentStatus}
                onChange={(event) => setAssignmentStatus(event.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs text-slate-400">
              Quiz status
              <select
                className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs"
                value={quizStatus}
                onChange={(event) => setQuizStatus(event.target.value)}
              >
                <option value="">All</option>
                <option value="attempted">Attempted</option>
                <option value="not_started">Not started</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs text-slate-400">
              Due from
              <input
                className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs"
                type="date"
                value={dueFrom}
                onChange={(event) => setDueFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-xs text-slate-400">
              Due to
              <input
                className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs"
                type="date"
                value={dueTo}
                onChange={(event) => setDueTo(event.target.value)}
              />
            </label>
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assignments</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setAssignmentsPage((prev) => Math.max(1, prev - 1))}
                >
                  <span className="inline-flex items-center gap-1"><ChevronLeft size={14} /> Prev</span>
                </Button>
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setAssignmentsPage((prev) => prev + 1)}
                >
                  <span className="inline-flex items-center gap-1">Next <ChevronRight size={14} /></span>
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(coursework?.assignments ?? []).map((assignment) => (
                <Link
                  key={assignment.id}
                  href={assignment.course?.id ? `/courses/${assignment.course.id}` : "/dashboard"}
                  className="block"
                >
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{assignment.title}</p>
                    <p className="text-xs text-slate-500">Due {assignment.due_at ?? "-"}</p>
                    <p className="text-xs text-slate-500">Status {assignment.status}</p>
                  </Card>
                </Link>
              ))}
              {!(coursework?.assignments ?? []).length && (
                <p className="text-sm text-slate-400">No assignments found.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quizzes</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setQuizzesPage((prev) => Math.max(1, prev - 1))}
                >
                  <span className="inline-flex items-center gap-1"><ChevronLeft size={14} /> Prev</span>
                </Button>
                <Button
                  type="button"
                  className="px-3 py-1 text-xs"
                  onClick={() => setQuizzesPage((prev) => prev + 1)}
                >
                  <span className="inline-flex items-center gap-1">Next <ChevronRight size={14} /></span>
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(coursework?.quizzes ?? []).map((quiz) => (
                <Link
                  key={quiz.id}
                  href={quiz.course?.id ? `/courses/${quiz.course.id}` : "/dashboard"}
                  className="block"
                >
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{quiz.title}</p>
                    <p className="text-xs text-slate-500">Status {quiz.status}</p>
                    <p className="text-xs text-slate-500">
                      Attempts {quiz.attempts_used}/{quiz.max_attempts ?? "-"}
                    </p>
                  </Card>
                </Link>
              ))}
              {!(coursework?.quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes found.</p>
              )}
            </div>
          </Panel>
        </section>
      </main>
    </RequireAuth>
  );
}

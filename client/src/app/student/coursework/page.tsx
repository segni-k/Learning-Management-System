"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { listStudentCoursework } from "@/lib/student";
import type { StudentCoursework } from "@/lib/types";

export default function StudentCourseworkPage() {
  const [coursework, setCoursework] = useState<StudentCoursework | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [quizStatus, setQuizStatus] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [quizzesPage, setQuizzesPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listStudentCoursework({
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
  }, [assignmentStatus, quizStatus, dueFrom, dueTo, assignmentsPage, quizzesPage]);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="text-3xl font-semibold">Coursework</h1>
          <p className="text-sm text-slate-400">Filter assignments and quiz availability.</p>
          <Link className="text-xs text-amber-300" href="/dashboard">
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
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
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assignments</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-slate-700/80 px-3 py-1 text-xs"
                  type="button"
                  onClick={() => setAssignmentsPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </button>
                <button
                  className="rounded-full border border-slate-700/80 px-3 py-1 text-xs"
                  type="button"
                  onClick={() => setAssignmentsPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(coursework?.assignments ?? []).map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{assignment.title}</p>
                  <p className="text-xs text-slate-500">Due {assignment.due_at ?? "-"}</p>
                  <p className="text-xs text-slate-500">Status {assignment.status}</p>
                </div>
              ))}
              {!(coursework?.assignments ?? []).length && (
                <p className="text-sm text-slate-400">No assignments found.</p>
              )}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quizzes</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-slate-700/80 px-3 py-1 text-xs"
                  type="button"
                  onClick={() => setQuizzesPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </button>
                <button
                  className="rounded-full border border-slate-700/80 px-3 py-1 text-xs"
                  type="button"
                  onClick={() => setQuizzesPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(coursework?.quizzes ?? []).map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{quiz.title}</p>
                  <p className="text-xs text-slate-500">Status {quiz.status}</p>
                  <p className="text-xs text-slate-500">
                    Attempts {quiz.attempts_used}/{quiz.max_attempts ?? "-"}
                  </p>
                </div>
              ))}
              {!(coursework?.quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes found.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

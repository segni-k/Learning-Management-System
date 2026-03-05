"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getResumeLesson,
  getStudentOverview,
  listStudentActivity,
  listStudentCoursework,
  listStudentNotifications,
} from "@/lib/student";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import type {
  StudentActivity,
  StudentCoursework,
  StudentDashboardOverview,
  StudentNotifications,
  ResumeLesson,
} from "@/lib/types";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const [overview, setOverview] = useState<StudentDashboardOverview | null>(null);
  const [notifications, setNotifications] = useState<StudentNotifications | null>(null);
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [coursework, setCoursework] = useState<StudentCoursework | null>(null);
  const [resumeLesson, setResumeLesson] = useState<ResumeLesson>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [overviewResponse, notificationsResponse, activityResponse, courseworkResponse, resumeResponse] =
          await Promise.all([
            getStudentOverview(),
            listStudentNotifications(),
            listStudentActivity({ submissions_per_page: 5, attempts_per_page: 5 }),
            listStudentCoursework({ assignments_per_page: 5, quizzes_per_page: 5 }),
            getResumeLesson(),
          ]);
        setOverview(overviewResponse.data);
        setNotifications(notificationsResponse.data);
        setActivity(activityResponse.data);
        setCoursework(courseworkResponse.data);
        setResumeLesson(resumeResponse.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load courses");
      }
    };

    void load();
  }, [user]);

  const recentSubmissions = useMemo(
    () => activity?.assignment_submissions?.slice(0, 5) ?? [],
    [activity]
  );
  const recentAttempts = useMemo(
    () => activity?.quiz_attempts?.slice(0, 5) ?? [],
    [activity]
  );

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <h1 className="text-3xl font-semibold">Welcome back, {user?.name ?? "there"}</h1>
            <p className="text-sm text-slate-400">Your courses and learning activity.</p>
          </div>
          <button
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200"
            type="button"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overview</h2>
            <Link className="text-sm text-lime-300" href="/">
              Back to home
            </Link>
          </div>

          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(overview?.courses ?? []).map((course) => (
              <article key={course.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {course.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {course.completed_lessons}/{course.total_lessons} lessons completed
                </p>
                <p className="text-xs text-slate-500">Avg progress: {course.average_progress}%</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Link className="text-lime-300" href={`/courses/${course.id}`}>
                    Open course
                  </Link>
                  <Link className="text-slate-300" href={`/courses/${course.id}`}>
                    Dashboard
                  </Link>
                </div>
              </article>
            ))}
            {!(overview?.courses ?? []).length && (
              <p className="text-sm text-slate-400">No enrolled courses yet.</p>
            )}
          </div>
        </section>

        {resumeLesson ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Resume lesson</h2>
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold">{resumeLesson.lesson?.title}</p>
              <p className="text-xs text-slate-400">
                {resumeLesson.course?.title} · {resumeLesson.module?.title}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Progress: {resumeLesson.progress_percent}%
              </p>
              <Link className="mt-3 inline-flex text-xs text-lime-300" href={`/courses/${resumeLesson.course?.id}`}>
                Continue
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Upcoming assignments</h2>
            <div className="mt-4 space-y-3">
              {(overview?.upcoming_assignments ?? []).map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{assignment.title}</p>
                  <p className="text-xs text-slate-500">
                    {assignment.course_id ? `Course #${assignment.course_id}` : ""} · Due {assignment.due_at}
                  </p>
                </div>
              ))}
              {!(overview?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Available quizzes</h2>
            <div className="mt-4 space-y-3">
              {(overview?.available_quizzes ?? []).map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{quiz.title}</p>
                  <p className="text-xs text-slate-500">
                    {quiz.course_id ? `Course #${quiz.course_id}` : ""} · Attempts {quiz.max_attempts ?? "-"}
                  </p>
                </div>
              ))}
              {!(overview?.available_quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes available.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Upcoming assignments</p>
                <ul className="mt-2 space-y-2">
                  {(notifications?.upcoming_assignments ?? []).map((item) => (
                    <li key={`assignment-${item.id}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-500">Due {item.due_at}</p>
                    </li>
                  ))}
                  {!(notifications?.upcoming_assignments ?? []).length && (
                    <li className="text-sm text-slate-400">No upcoming assignments.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">New lessons</p>
                <ul className="mt-2 space-y-2">
                  {(notifications?.new_lessons ?? []).map((item) => (
                    <li key={`lesson-${item.id}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-500">Added {item.created_at}</p>
                    </li>
                  ))}
                  {!(notifications?.new_lessons ?? []).length && (
                    <li className="text-sm text-slate-400">No new lessons.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">New quizzes</p>
                <ul className="mt-2 space-y-2">
                  {(notifications?.new_quizzes ?? []).map((item) => (
                    <li key={`quiz-${item.id}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-500">Added {item.created_at}</p>
                    </li>
                  ))}
                  {!(notifications?.new_quizzes ?? []).length && (
                    <li className="text-sm text-slate-400">No new quizzes.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <div className="mt-4 space-y-3 text-sm">
              {recentSubmissions.map((item) => (
                <div key={`submission-${item.id}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-medium">Assignment submitted</p>
                  <p className="text-xs text-slate-500">
                    {item.assignment?.title} · {item.submitted_at}
                  </p>
                </div>
              ))}
              {recentAttempts.map((item) => (
                <div key={`attempt-${item.id}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-medium">Quiz attempt</p>
                  <p className="text-xs text-slate-500">
                    {item.quiz?.title} · {item.completed_at} · Score {item.score ?? "-"}
                  </p>
                </div>
              ))}
              {!recentSubmissions.length && !recentAttempts.length && (
                <p className="text-sm text-slate-400">No recent activity.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">Coursework</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments</p>
              {(coursework?.assignments ?? []).map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-medium">{assignment.title}</p>
                  <p className="text-xs text-slate-500">
                    {assignment.status} · Due {assignment.due_at ?? "-"}
                  </p>
                </div>
              ))}
              {!(coursework?.assignments ?? []).length && (
                <p className="text-sm text-slate-400">No assignments found.</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quizzes</p>
              {(coursework?.quizzes ?? []).map((quiz) => (
                <div key={quiz.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-medium">{quiz.title}</p>
                  <p className="text-xs text-slate-500">
                    {quiz.status} · Attempts {quiz.attempts_used}/{quiz.max_attempts ?? "-"}
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

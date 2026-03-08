"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getResumeLesson,
  getStudentOverview,
  listStudentActivity,
  listStudentCoursework,
  listStudentNotifications,
} from "@/lib/student";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  StudentActivity,
  StudentCoursework,
  StudentDashboardOverview,
  StudentNotifications,
  ResumeLesson,
} from "@/lib/types";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<StudentDashboardOverview | null>(null);
  const [notifications, setNotifications] = useState<StudentNotifications | null>(null);
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [coursework, setCoursework] = useState<StudentCoursework | null>(null);
  const [resumeLesson, setResumeLesson] = useState<ResumeLesson>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const [overviewResponse, notificationsResponse, activityResponse, courseworkResponse, resumeResponse] =
        await Promise.all([
          getStudentOverview(),
          listStudentNotifications(),
          listStudentActivity({ submissions_per_page: 10, attempts_per_page: 10 }),
          listStudentCoursework({ assignments_per_page: 10, quizzes_per_page: 10 }),
          getResumeLesson(),
        ]);

      setOverview(overviewResponse.data);
      setNotifications(notificationsResponse.data);
      setActivity(activityResponse.data);
      setCoursework(courseworkResponse.data);
      setResumeLesson(resumeResponse.data);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const recentSubmissions = useMemo(
    () => activity?.assignment_submissions?.slice(0, 5) ?? [],
    [activity]
  );
  const recentAttempts = useMemo(
    () => activity?.quiz_attempts?.slice(0, 5) ?? [],
    [activity]
  );

  const snapshot = useMemo(() => {
    const courses = overview?.courses ?? [];
    const totalLessons = courses.reduce((sum, course) => sum + course.total_lessons, 0);
    const completedLessons = courses.reduce((sum, course) => sum + course.completed_lessons, 0);
    const averageProgress = courses.length
      ? Math.round(courses.reduce((sum, course) => sum + course.average_progress, 0) / courses.length)
      : 0;

    const assignments = coursework?.assignments ?? [];
    const quizzes = coursework?.quizzes ?? [];

    return {
      courses: courses.length,
      totalLessons,
      completedLessons,
      averageProgress,
      pendingAssignments: assignments.filter((item) => item.status === "pending" || item.status === "overdue")
        .length,
      attemptedQuizzes: quizzes.filter((item) => item.status === "attempted").length,
      overdueAssignments: assignments.filter((item) => item.status === "overdue").length,
      gradedAssignments: assignments.filter((item) => item.status === "graded").length,
      notifications:
        (notifications?.upcoming_assignments?.length ?? 0) +
        (notifications?.new_lessons?.length ?? 0) +
        (notifications?.new_quizzes?.length ?? 0),
    };
  }, [overview, coursework, notifications]);

  const focusAssignments = useMemo(
    () =>
      (coursework?.assignments ?? [])
        .filter((item) => item.status === "overdue" || item.status === "pending")
        .slice(0, 5),
    [coursework]
  );

  const focusQuizzes = useMemo(
    () => (coursework?.quizzes ?? []).filter((item) => item.status === "not_started").slice(0, 5),
    [coursework]
  );

  const topCourses = useMemo(
    () =>
      [...(overview?.courses ?? [])]
        .sort((a, b) => b.average_progress - a.average_progress)
        .slice(0, 3),
    [overview]
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const dashboardBenefits = [
    {
      title: "Learning roadmap",
      description: "See your enrolled courses, lesson completion, and average progress in one view.",
    },
    {
      title: "Assessment readiness",
      description: "Check upcoming assignments and available quizzes before deadlines.",
    },
    {
      title: "Continuous tracking",
      description: "Follow notifications, submissions, and attempts to stay on pace each week.",
    },
  ];

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Welcome back, {user?.name ?? "there"}
            </h1>
            <p className="text-sm text-slate-400">Your learning hub with progress, tasks, and activity in one place.</p>
            {lastUpdatedAt ? (
              <p className="mt-1 text-xs text-slate-500">Last updated: {new Date(lastUpdatedAt).toLocaleString()}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" className="px-5 py-2 text-sm" onClick={() => void loadDashboard()}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button type="button" className="px-5 py-2 text-sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">My learning</p>
              <h2 className="text-lg font-semibold">Everything in one place</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link className="rounded-full border border-slate-700/80 px-3 py-1.5 text-slate-200" href="/student/coursework">
                Coursework
              </Link>
              <Link className="rounded-full border border-slate-700/80 px-3 py-1.5 text-slate-200" href="/student/activity">
                Activity
              </Link>
              <Link className="rounded-full border border-slate-700/80 px-3 py-1.5 text-slate-200" href="/student/notifications">
                Notifications
              </Link>
              <Link className="rounded-full border border-slate-700/80 px-3 py-1.5 text-slate-200" href="/courses">
                Catalog
              </Link>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Continue learning</h2>
              <p className="text-xs text-slate-500">Jump back into your latest lesson or open your top courses.</p>
            </div>
            <Link className="text-sm text-amber-300" href="/courses">
              View all courses
            </Link>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="p-4">
              {resumeLesson ? (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resume lesson</p>
                  <p className="mt-2 text-base font-semibold">{resumeLesson.lesson?.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {resumeLesson.course?.title} · {resumeLesson.module?.title}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.min(Math.max(resumeLesson.progress_percent ?? 0, 0), 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Progress {resumeLesson.progress_percent}%</p>
                  <Link
                    className="mt-3 inline-flex text-xs font-medium text-amber-300"
                    href={`/courses/${resumeLesson.course?.id}`}
                  >
                    Continue now
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-200">No lesson to resume yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Open a course to start your learning path.</p>
                </>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top course progress</p>
              <div className="mt-3 space-y-3">
                {topCourses.map((course) => (
                  <div key={`top-${course.id}`}>
                    <div className="flex items-center justify-between text-xs">
                      <p className="truncate text-slate-200">{course.title}</p>
                      <span className="text-slate-400">{course.average_progress}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${Math.min(Math.max(course.average_progress, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!topCourses.length && <p className="text-xs text-slate-500">No enrolled courses yet.</p>}
              </div>
            </Card>
          </div>
        </Panel>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Enrolled courses</p>
            <p className="mt-2 text-2xl font-semibold">{snapshot.courses}</p>
            <p className="mt-1 text-xs text-slate-400">Active learning spaces</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lesson progress</p>
            <p className="mt-2 text-2xl font-semibold">
              {snapshot.completedLessons}/{snapshot.totalLessons}
            </p>
            <p className="mt-1 text-xs text-slate-400">Avg progress {snapshot.averageProgress}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending work</p>
            <p className="mt-2 text-2xl font-semibold">{snapshot.pendingAssignments}</p>
            <p className="mt-1 text-xs text-slate-400">{snapshot.overdueAssignments} overdue items</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Activity signal</p>
            <p className="mt-2 text-2xl font-semibold">{snapshot.notifications}</p>
            <p className="mt-1 text-xs text-slate-400">
              Alerts + updates · {snapshot.attemptedQuizzes} attempted quizzes
            </p>
          </Card>
        </section>

        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overview</h2>
            <Link className="text-sm text-amber-300" href="/">
              Back to home
            </Link>
          </div>

          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(overview?.courses ?? []).map((course) => (
              <Card key={course.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <Badge>{course.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {course.completed_lessons}/{course.total_lessons} lessons completed
                </p>
                <p className="text-xs text-slate-500">Avg progress: {course.average_progress}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min(Math.max(course.average_progress, 0), 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Link className="text-amber-300" href={`/courses/${course.id}`}>
                    Open course
                  </Link>
                  <Link className="text-slate-300" href={`/courses/${course.id}/dashboard`}>
                    Dashboard
                  </Link>
                </div>
              </Card>
            ))}
            {!(overview?.courses ?? []).length && (
              <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/60 p-5">
                <p className="text-sm text-slate-200">No enrolled courses yet.</p>
                <p className="mt-2 text-xs text-slate-400">
                  Browse the catalog to enroll and start learning.
                </p>
                <Link className="mt-3 inline-flex text-xs text-amber-300" href="/courses">
                  Explore courses
                </Link>
              </div>
            )}
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <h2 className="text-lg font-semibold">Focus now</h2>
            <p className="mt-1 text-xs text-slate-500">
              Prioritized actions from your coursework and assessments.
            </p>
            <div className="mt-4 space-y-3">
              {focusAssignments.map((assignment) => (
                <Link
                  key={`focus-assignment-${assignment.id}`}
                  href={assignment.course?.id ? `/courses/${assignment.course.id}` : `/student/coursework?assignments_status=${assignment.status}`}
                  className="block"
                >
                  <Card className="p-3">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.status.toUpperCase()} · Due {formatDate(assignment.due_at)}
                    </p>
                  </Card>
                </Link>
              ))}
              {!focusAssignments.length && (
                <p className="text-sm text-slate-400">No urgent assignments right now.</p>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {focusQuizzes.map((quiz) => (
                <Link
                  key={`focus-quiz-${quiz.id}`}
                  href={quiz.course?.id ? `/courses/${quiz.course.id}` : "/student/coursework?quiz_status=not_started"}
                  className="block"
                >
                  <Card className="p-3">
                    <p className="text-sm font-medium">{quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      Not started · Attempts left {quiz.attempts_remaining ?? quiz.max_attempts ?? "-"}
                    </p>
                  </Card>
                </Link>
              ))}
              {!focusQuizzes.length && (
                <p className="text-sm text-slate-400">No pending quizzes right now.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">Learning performance</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments graded</p>
                <p className="mt-2 text-xl font-semibold">{snapshot.gradedAssignments}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quiz attempts made</p>
                <p className="mt-2 text-xl font-semibold">{snapshot.attemptedQuizzes}</p>
              </Card>
              <Card className="p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resume lesson</p>
                {resumeLesson ? (
                  <>
                    <p className="mt-2 text-sm font-medium">{resumeLesson.lesson?.title}</p>
                    <p className="text-xs text-slate-500">{resumeLesson.course?.title} · {resumeLesson.module?.title}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">No lesson to resume yet.</p>
                )}
              </Card>
            </div>
          </Panel>
        </section>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">What you get in your LMS dashboard</h2>
            <Link className="text-sm text-amber-300" href="/courses">
              Browse courses
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {dashboardBenefits.map((benefit) => (
              <Card key={benefit.title} className="p-4">
                <p className="text-sm font-semibold">{benefit.title}</p>
                <p className="mt-2 text-xs text-slate-400">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </Panel>

        {resumeLesson ? (
          <Panel>
            <h2 className="text-lg font-semibold">Resume lesson</h2>
            <Card className="mt-3">
              <p className="text-sm font-semibold">{resumeLesson.lesson?.title}</p>
              <p className="text-xs text-slate-400">
                {resumeLesson.course?.title} · {resumeLesson.module?.title}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Progress: {resumeLesson.progress_percent}%
              </p>
              <Link
                className="mt-3 inline-flex text-xs text-amber-300"
                href={`/courses/${resumeLesson.course?.id}`}
              >
                Continue
              </Link>
            </Card>
          </Panel>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Upcoming assignments</h2>
              <Link className="text-xs text-amber-300" href="/student/coursework?assignments_status=pending">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {(overview?.upcoming_assignments ?? []).map((assignment) => (
                <Link key={assignment.id} href={assignment.course_id ? `/courses/${assignment.course_id}` : "/student/coursework"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{assignment.title}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.course_id ? `Course #${assignment.course_id}` : ""} · Due {formatDate(assignment.due_at)}
                    </p>
                  </Card>
                </Link>
              ))}
              {!(overview?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Available quizzes</h2>
              <Link className="text-xs text-amber-300" href="/student/coursework?quiz_status=not_started">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {(overview?.available_quizzes ?? []).map((quiz) => (
                <Link key={quiz.id} href={quiz.course_id ? `/courses/${quiz.course_id}` : "/student/coursework?quiz_status=not_started"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-semibold">{quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      {quiz.course_id ? `Course #${quiz.course_id}` : ""} · Attempts {quiz.max_attempts ?? "-"}
                    </p>
                  </Card>
                </Link>
              ))}
              {!(overview?.available_quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes available.</p>
              )}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Link className="text-xs text-amber-300" href="/student/notifications">
                Open notifications
              </Link>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Upcoming assignments</p>
                <ul className="mt-2 space-y-2">
                  {(notifications?.upcoming_assignments ?? []).map((item) => (
                    <li key={`assignment-${item.id}`}>
                      <Link href={item.course?.id ? `/courses/${item.course.id}` : "/student/notifications"} className="block rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-slate-500">Due {formatDate(item.due_at)}</p>
                      </Link>
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
                    <li key={`lesson-${item.id}`}>
                      <Link href={item.course?.id ? `/courses/${item.course.id}` : "/student/notifications"} className="block rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-slate-500">Added {formatDate(item.created_at)}</p>
                      </Link>
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
                    <li key={`quiz-${item.id}`}>
                      <Link href={item.course?.id ? `/courses/${item.course.id}` : "/student/notifications"} className="block rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-slate-500">Added {formatDate(item.created_at)}</p>
                      </Link>
                    </li>
                  ))}
                  {!(notifications?.new_quizzes ?? []).length && (
                    <li className="text-sm text-slate-400">No new quizzes.</li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <Link className="text-xs text-amber-300" href="/student/activity">
                Open activity
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {recentSubmissions.map((item) => (
                <Link key={`submission-${item.id}`} href={item.course?.id ? `/courses/${item.course.id}` : "/student/activity"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-medium">Assignment submitted</p>
                    <p className="text-xs text-slate-500">
                      {item.assignment?.title} · {formatDate(item.submitted_at)}
                    </p>
                  </Card>
                </Link>
              ))}
              {recentAttempts.map((item) => (
                <Link key={`attempt-${item.id}`} href={item.course?.id ? `/courses/${item.course.id}` : "/student/activity"} className="block">
                  <Card className="p-3">
                    <p className="text-sm font-medium">Quiz attempt</p>
                    <p className="text-xs text-slate-500">
                      {item.quiz?.title} · {formatDate(item.completed_at)} · Score {item.score ?? "-"}
                    </p>
                  </Card>
                </Link>
              ))}
              {!recentSubmissions.length && !recentAttempts.length && (
                <p className="text-sm text-slate-400">No recent activity.</p>
              )}
            </div>
          </Panel>
        </section>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Coursework</h2>
            <Link className="text-xs text-amber-300" href="/student/coursework">
              Open coursework
            </Link>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments</p>
              {(coursework?.assignments ?? []).map((assignment) => (
                <Link
                  key={assignment.id}
                  href={assignment.course?.id ? `/courses/${assignment.course.id}` : `/student/coursework?assignments_status=${assignment.status}`}
                  className="block"
                >
                  <Card className="p-3">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.status} · Due {formatDate(assignment.due_at)}
                    </p>
                  </Card>
                </Link>
              ))}
              {!(coursework?.assignments ?? []).length && (
                <p className="text-sm text-slate-400">No assignments found.</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quizzes</p>
              {(coursework?.quizzes ?? []).map((quiz) => (
                <Link
                  key={quiz.id}
                  href={quiz.course?.id ? `/courses/${quiz.course.id}` : `/student/coursework?quiz_status=${quiz.status}`}
                  className="block"
                >
                  <Card className="p-3">
                    <p className="text-sm font-medium">{quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      {quiz.status} · Attempts {quiz.attempts_used}/{quiz.max_attempts ?? "-"}
                    </p>
                  </Card>
                </Link>
              ))}
              {!(coursework?.quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes found.</p>
              )}
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold">Everything at a glance</h2>
          <p className="mt-2 text-sm text-slate-400">
            You are viewing courses, progress, resume point, assignments, quizzes, notifications,
            and recent activity from your student LMS endpoints in one dashboard.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-3">
              <p className="text-xs text-slate-500">Courses loaded</p>
              <p className="text-lg font-semibold">{overview?.courses?.length ?? 0}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-slate-500">Assignments loaded</p>
              <p className="text-lg font-semibold">{coursework?.assignments?.length ?? 0}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-slate-500">Quizzes loaded</p>
              <p className="text-lg font-semibold">{coursework?.quizzes?.length ?? 0}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-slate-500">Activity items loaded</p>
              <p className="text-lg font-semibold">
                {(activity?.assignment_submissions?.length ?? 0) + (activity?.quiz_attempts?.length ?? 0)}
              </p>
            </Card>
          </div>
        </Panel>
      </main>
    </RequireAuth>
  );
}

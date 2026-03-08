"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  const studentBenefits = [
    {
      title: "Clear learning path",
      copy: "Follow modules and lessons in order, so you always know what to learn next.",
    },
    {
      title: "One dashboard for everything",
      copy: "Track upcoming assignments, quizzes, notifications, and recent activity in one place.",
    },
    {
      title: "Resume where you stopped",
      copy: "Jump back to your latest lesson with saved progress and continue without searching.",
    },
    {
      title: "Transparent performance",
      copy: "Review scores, attempts, and completion progress to improve steadily every week.",
    },
  ];

  return (
    <div className="min-h-screen text-slate-100">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 py-24 md:py-28">
        <header className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">
              Learning management system
            </p>
            <h1 className="font-display text-5xl leading-tight md:text-6xl lg:text-7xl">
              Build better learning outcomes with one focused LMS workspace.
            </h1>
            <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
              Atlas LMS brings instructors, students, and administrators into a unified space for
              lessons, assessments, progress, and analytics backed by a Laravel API.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950"
                href={user ? "/dashboard" : "/login"}
              >
                {loading ? "Checking session..." : user ? "Go to dashboard" : "Sign in"}
              </Link>
              <Link
                className="rounded-full border border-slate-700/80 px-6 py-3 text-sm font-semibold text-slate-200"
                href="/register"
              >
                Create account
              </Link>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-7 md:p-8">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active cohort</p>
                <p className="mt-2 text-3xl font-semibold">Design Foundations</p>
                <p className="text-xs text-slate-400">Week 4 · 72 learners</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Completion rate</p>
                  <p className="text-2xl font-semibold">84%</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Assignments due</p>
                  <p className="text-2xl font-semibold">6</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Course momentum",
              copy: "Sequenced modules, lessons, and resources keep cohorts moving together.",
            },
            {
              title: "Assessment flow",
              copy: "Assignments and quizzes stay organized with grading and attempts history.",
            },
            {
              title: "Progress clarity",
              copy: "Track completion and surface exactly where learners should resume.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass-panel rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-3 text-sm text-slate-400">{card.copy}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student experience</p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">What students get from this LMS</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {studentBenefits.map((benefit) => (
              <div key={benefit.title} className="glass-panel rounded-2xl p-6">
                <h3 className="text-lg font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{benefit.copy}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Everything connects to your dashboard</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Lessons, assignments, quizzes, notifications, and progress all feed into the student
              dashboard so each learner can plan their next action quickly.
            </p>
            <Link className="mt-4 inline-flex rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950" href={user ? "/dashboard" : "/login"}>
              {user ? "Open dashboard" : "Sign in to view dashboard"}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

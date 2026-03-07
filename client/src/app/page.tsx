"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-20">
        <header className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">
              Learning management system
            </p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Orchestrate learning journeys with clarity, pace, and accountability.
            </h1>
            <p className="max-w-2xl text-base text-slate-300">
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
          <div className="glass-panel rounded-3xl p-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active cohort</p>
                <p className="mt-2 text-2xl font-semibold">Design Foundations</p>
                <p className="text-xs text-slate-400">Week 4 · 72 learners</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Completion rate</p>
                  <p className="text-xl font-semibold">84%</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Assignments due</p>
                  <p className="text-xl font-semibold">6</p>
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
      </main>
    </div>
  );
}

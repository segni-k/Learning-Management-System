"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-20">
        <header className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-lime-200/70">
            Learning management system
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            A focused space for instructors and students to keep learning in motion.
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Track courses, lessons, assessments, and progress in one place. This client app talks to the
            Laravel API using Sanctum session cookies.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              className="rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-slate-900"
              href={user ? "/dashboard" : "/login"}
            >
              {loading ? "Checking session..." : user ? "Go to dashboard" : "Sign in"}
            </Link>
            <Link
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200"
              href="/register"
            >
              Create account
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Course momentum",
              copy: "Keep lessons, modules, and resources moving with clear sequencing.",
            },
            {
              title: "Assessment flow",
              copy: "Assignments and quizzes stay visible with due dates and submissions.",
            },
            {
              title: "Progress clarity",
              copy: "Track completion and identify exactly where to continue learning.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
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

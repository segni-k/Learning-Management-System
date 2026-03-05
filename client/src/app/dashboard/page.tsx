"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listCourses } from "@/lib/courses";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import type { Course } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const response = await listCourses();
        setCourses(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load courses");
      }
    };

    void load();
  }, [user]);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <h1 className="text-3xl font-semibold">Welcome back, {user.name}</h1>
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
            <h2 className="text-lg font-semibold">Available courses</h2>
            <Link className="text-sm text-lime-300" href="/">
              Back to home
            </Link>
          </div>

          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-400 line-clamp-3">
                  {course.description ?? "No description yet."}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase tracking-[0.2em]">{course.status}</span>
                  <span>{course.instructor?.name ?? "Instructor TBD"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

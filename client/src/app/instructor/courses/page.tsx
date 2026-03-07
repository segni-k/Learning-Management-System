"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createCourse, listCourses } from "@/lib/courses";
import { RequireRole } from "@/components/require-role";
import type { Course } from "@/lib/types";

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const response = await listCourses();
      setCourses(response.data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load courses");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setCreating(true);
    try {
      await createCourse({
        title,
        description,
        status: "draft",
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  return (
    <RequireRole roles={["instructor", "admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Instructor</p>
          <h1 className="text-3xl font-semibold">Course management</h1>
          <p className="text-sm text-slate-400">Create and manage your courses.</p>
        </header>

        <form onSubmit={handleCreate} className="glass-panel rounded-2xl p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Course title
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Description
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>
          <button
            className="mt-4 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900"
            type="submit"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create course"}
          </button>
          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </form>

        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Your courses</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {course.description ?? "No description yet."}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase tracking-[0.2em]">{course.status}</span>
                  <Link className="text-amber-300" href={`/instructor/courses/${course.id}`}>
                    Manage
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </RequireRole>
  );
}

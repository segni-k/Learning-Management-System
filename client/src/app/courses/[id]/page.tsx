"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { RequireAuth } from "@/components/require-auth";
import type { Course } from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    const load = async () => {
      try {
        const response = await getCourse(id);
        setCourse(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load course");
      }
    };

    void load();
  }, [id]);

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Course Detail</p>
          <h1 className="text-3xl font-semibold">{course?.title ?? "Loading..."}</h1>
          <p className="text-sm text-slate-400">{course?.description ?? ""}</p>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">Modules</h2>
          <div className="mt-4 space-y-4">
            {course?.modules?.map((module) => (
              <div key={module.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="text-base font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{module.description ?? ""}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {module.lessons?.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between">
                      <span>{lesson.title}</span>
                      {lesson.is_published ? (
                        <span className="text-xs text-lime-300">Published</span>
                      ) : (
                        <span className="text-xs text-slate-500">Draft</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!course?.modules?.length && (
              <p className="text-sm text-slate-400">No modules yet.</p>
            )}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

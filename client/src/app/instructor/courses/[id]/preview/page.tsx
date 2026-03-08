"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCourse } from "@/lib/courses";
import { RequireRole } from "@/components/require-role";
import { SectionHeader } from "@/components/ui/section-header";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course, Module } from "@/lib/types";

export default function InstructorCoursePreviewPage() {
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
        setStatus(error instanceof Error ? error.message : "Failed to load course preview");
      }
    };

    void load();
  }, [id]);

  const orderedModules = useMemo(() => {
    const modules = course?.modules ?? [];
    return [...modules].sort((a, b) => a.sort_order - b.sort_order);
  }, [course]);

  const getTakeaways = (module: Module) => {
    if (module.takeaways?.length) return module.takeaways;
    return module.lessons?.slice(0, 3).map((lesson) => lesson.title) ?? [];
  };

  return (
    <RequireRole roles={["instructor", "admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeader
          eyebrow="Instructor"
          title={course?.title ?? "Course preview"}
          description="See how learners experience the course."
          action={
            id ? (
              <Link className="text-xs text-amber-300" href={`/instructor/courses/${id}`}>
                Back to manage
              </Link>
            ) : null
          }
        />

        {status ? <p className="text-sm text-rose-300">{status}</p> : null}

        <header className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Preview</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{course?.status ?? "draft"}</Badge>
              {course?.level ? (
                <Badge className="border-amber-400/40 text-amber-200">{course.level}</Badge>
              ) : null}
              {course?.instructor?.name ? (
                <span className="text-xs text-slate-400">Instructor {course.instructor.name}</span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {course?.title ?? "Loading..."}
            </h1>
            <p className="text-sm text-slate-400">{course?.description ?? ""}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modules</p>
                <p className="text-lg font-semibold">{course?.modules?.length ?? 0}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lessons</p>
                <p className="text-lg font-semibold">
                  {course?.modules?.reduce(
                    (total, module) => total + (module.lessons?.length ?? 0),
                    0
                  ) ?? 0}
                </p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assessments</p>
                <p className="text-lg font-semibold">
                  {(course?.assignments?.length ?? 0) + (course?.quizzes?.length ?? 0)}
                </p>
              </Card>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-amber-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/70">
              <Image
                loader={({ src }) => src}
                unoptimized
                src={course?.thumbnail_path || "/images/courses/default.svg"}
                alt={course?.title ?? "Course"}
                width={1280}
                height={720}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="h-[280px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            </div>
          </div>
        </header>

        <Panel>
          <h2 className="text-lg font-semibold">Modules</h2>
          <div className="mt-4 space-y-4">
            {orderedModules.map((module) => {
              const takeaways = getTakeaways(module);
              return (
                <Card key={module.id} className="p-4">
                  <h3 className="text-base font-semibold">{module.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{module.description ?? ""}</p>
                  {takeaways.length ? (
                    <div className="mt-3 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Key takeaways
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {takeaways.map((item, index) => (
                          <li key={`${module.id}-takeaway-${index}`} className="flex items-center gap-2">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/40 text-amber-300">
                              <svg
                                aria-hidden
                                viewBox="0 0 16 16"
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 8.25l2.25 2.25L12 5.75" />
                              </svg>
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {module.lessons?.map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between">
                        <span>{lesson.title}</span>
                        <Badge className={lesson.is_published ? "border-amber-400/40 text-amber-200" : ""}>
                          {lesson.is_published ? "Published" : "Draft"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  {!module.lessons?.length && (
                    <p className="mt-3 text-sm text-slate-400">No lessons yet.</p>
                  )}
                </Card>
              );
            })}
            {!orderedModules.length && <p className="text-sm text-slate-400">No modules yet.</p>}
          </div>
        </Panel>
      </main>
    </RequireRole>
  );
}

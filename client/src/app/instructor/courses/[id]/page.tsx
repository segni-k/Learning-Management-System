"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  createLesson,
  createModule,
  getCourse,
  updateLesson,
  updateModule,
} from "@/lib/courses";
import { RequireRole } from "@/components/require-role";
import type { Course, Lesson, Module } from "@/lib/types";

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessonTitle, setLessonTitle] = useState<Record<number, string>>({});
  const [editingModule, setEditingModule] = useState<Record<number, string>>({});
  const [editingLesson, setEditingLesson] = useState<Record<number, string>>({});

  const moduleCount = useMemo(() => course?.modules?.length ?? 0, [course]);

  const load = async () => {
    if (!id || Number.isNaN(id)) return;

    try {
      const response = await getCourse(id);
      setCourse(response.data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load course");
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleCreateModule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setStatus(null);

    try {
      await createModule(id, {
        title: moduleTitle,
        description: moduleDescription,
        sort_order: moduleCount + 1,
      });
      setModuleTitle("");
      setModuleDescription("");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create module");
    }
  };

  const handleUpdateModule = async (module: Module) => {
    const title = editingModule[module.id];
    if (!title) return;

    try {
      await updateModule(module.id, { title });
      setEditingModule((prev) => ({ ...prev, [module.id]: "" }));
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update module");
    }
  };

  const handleCreateLesson = async (module: Module) => {
    const title = lessonTitle[module.id];
    if (!title) return;

    try {
      await createLesson(module.id, { title, sort_order: (module.lessons?.length ?? 0) + 1 });
      setLessonTitle((prev) => ({ ...prev, [module.id]: "" }));
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create lesson");
    }
  };

  const handleUpdateLesson = async (lesson: Lesson) => {
    const title = editingLesson[lesson.id];
    if (!title) return;

    try {
      await updateLesson(lesson.id, { title });
      setEditingLesson((prev) => ({ ...prev, [lesson.id]: "" }));
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update lesson");
    }
  };

  return (
    <RequireRole roles={["instructor", "admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Instructor</p>
          <h1 className="text-3xl font-semibold">{course?.title ?? "Course"}</h1>
          <p className="text-sm text-slate-400">Manage modules and lessons.</p>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <form
          onSubmit={handleCreateModule}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <h2 className="text-lg font-semibold">Create module</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Title
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Description
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                value={moduleDescription}
                onChange={(event) => setModuleDescription(event.target.value)}
              />
            </label>
          </div>
          <button
            className="mt-4 rounded-full bg-lime-300 px-5 py-2 text-sm font-semibold text-slate-900"
            type="submit"
          >
            Add module
          </button>
        </form>

        <section className="space-y-4">
          {course?.modules?.map((module) => (
            <div key={module.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-sm text-slate-400">{module.description ?? "No description"}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                    value={editingModule[module.id] ?? ""}
                    onChange={(event) =>
                      setEditingModule((prev) => ({ ...prev, [module.id]: event.target.value }))
                    }
                    placeholder="Rename module"
                  />
                  <button
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                    type="button"
                    onClick={() => void handleUpdateModule(module)}
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                    value={lessonTitle[module.id] ?? ""}
                    onChange={(event) =>
                      setLessonTitle((prev) => ({ ...prev, [module.id]: event.target.value }))
                    }
                    placeholder="New lesson title"
                  />
                  <button
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                    type="button"
                    onClick={() => void handleCreateLesson(module)}
                  >
                    Add lesson
                  </button>
                </div>

                <div className="space-y-2">
                  {module.lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-slate-500">
                          {lesson.is_published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                          value={editingLesson[lesson.id] ?? ""}
                          onChange={(event) =>
                            setEditingLesson((prev) => ({ ...prev, [lesson.id]: event.target.value }))
                          }
                          placeholder="Rename lesson"
                        />
                        <button
                          className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                          type="button"
                          onClick={() => void handleUpdateLesson(lesson)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                  {!module.lessons?.length && (
                    <p className="text-sm text-slate-400">No lessons yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </RequireRole>
  );
}

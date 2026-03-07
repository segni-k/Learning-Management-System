"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createCourse, listCourses } from "@/lib/courses";
import { RequireRole } from "@/components/require-role";
import { SectionHeader } from "@/components/ui/section-header";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeader
          eyebrow="Instructor"
          title="Course management"
          description="Create and manage your courses."
        />

        <Panel>
          <form onSubmit={handleCreate}>
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
            <Button
              type="submit"
              variant="primary"
              className="mt-4 px-5 py-2 text-sm"
              disabled={creating}
            >
            {creating ? "Creating..." : "Create course"}
            </Button>
            {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
          </form>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold">Your courses</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id} className="p-4">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {course.description ?? "No description yet."}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <Badge>{course.status}</Badge>
                  <Link className="text-amber-300" href={`/instructor/courses/${course.id}`}>
                    Manage
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Panel>
      </main>
    </RequireRole>
  );
}

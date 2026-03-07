"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { listCourses } from "@/lib/courses";
import { enrollInCourse, listEnrollments } from "@/lib/enrollments";
import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course, Enrollment } from "@/lib/types";

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          listCourses(),
          user?.role === "student" ? listEnrollments() : Promise.resolve({ data: [] as Enrollment[] }),
        ]);
        setCourses(coursesResponse.data);
        setEnrollments(enrollmentsResponse.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load courses");
      }
    };

    void load();
  }, [user?.role]);

  const enrollmentMap = useMemo(() => {
    const map = new Map<number, Enrollment>();
    enrollments.forEach((enrollment) => map.set(enrollment.course_id, enrollment));
    return map;
  }, [enrollments]);

  const handleEnroll = async (courseId: number) => {
    setStatus(null);
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      const response = await listEnrollments();
      setEnrollments(response.data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to enroll");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Courses</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Browse courses</h1>
          <p className="text-sm text-slate-400">Find a course and enroll instantly.</p>
          <Link className="text-xs text-amber-300" href="/dashboard">
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => {
              const enrollment = enrollmentMap.get(course.id);
              const isEnrolled = Boolean(enrollment);
              const thumbnail = course.thumbnail_path || "/images/courses/default.svg";
              return (
                <Card key={course.id} className="p-5">
                  <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70">
                    <Image
                      src={thumbnail}
                      alt={course.title}
                      width={960}
                      height={384}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{course.title}</h2>
                      <p className="text-xs text-slate-500">{course.level ?? ""}</p>
                    </div>
                    <Badge>{course.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-400 line-clamp-3">
                    {course.description ?? "No description yet."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <Link className="text-amber-300" href={`/courses/${course.id}`}>
                      View details
                    </Link>
                    {user?.role === "student" ? (
                      isEnrolled ? (
                        <Link className="text-slate-300" href={`/courses/${course.id}/dashboard`}>
                          Go to dashboard
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          className="px-4 py-2 text-xs"
                          onClick={() => void handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                        >
                          {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                        </Button>
                      )
                    ) : null}
                  </div>
                </Card>
              );
            })}
            {!courses.length && (
              <p className="text-sm text-slate-400">
                No published courses yet. Seed the database or create courses as an instructor.
              </p>
            )}
          </div>
        </Panel>
      </main>
    </RequireAuth>
  );
}

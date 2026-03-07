"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourse } from "@/lib/courses";
import { listEnrollments, enrollInCourse } from "@/lib/enrollments";
import {
  getStudentCourseDashboard,
  listStudentCoursework,
  upsertLessonProgress,
} from "@/lib/student";
import { listResources, resourceDownloadUrl } from "@/lib/resources";
import { createAssignmentSubmission } from "@/lib/submissions";
import { listQuizQuestions } from "@/lib/quiz-questions";
import { createQuizAttempt } from "@/lib/quiz-attempts";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import type {
  Course,
  StudentCourseDashboard,
  StudentCoursework,
  Resource,
  QuizQuestion,
} from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [dashboard, setDashboard] = useState<StudentCourseDashboard | null>(null);
  const [coursework, setCoursework] = useState<StudentCoursework | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [submissionContent, setSubmissionContent] = useState<Record<number, string>>({});
  const [submissionFile, setSubmissionFile] = useState<Record<number, File | null>>({});
  const [submittingAssignment, setSubmittingAssignment] = useState<Record<number, boolean>>({});
  const [quizQuestions, setQuizQuestions] = useState<Record<number, QuizQuestion[]>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, Record<number, string | string[]>>>(
    {}
  );
  const [quizSubmitting, setQuizSubmitting] = useState<Record<number, boolean>>({});
  const [quizResult, setQuizResult] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    const load = async () => {
      try {
        const response = await getCourse(id);
        setCourse(response.data);

        if (user?.role === "student") {
          const enrollmentResponse = await listEnrollments();
          const enrolled = enrollmentResponse.data.some((item) => item.course_id === id);
          setIsEnrolled(enrolled);

          const courseworkResponse = await listStudentCoursework({
            course_id: id,
            assignments_per_page: 20,
            quizzes_per_page: 20,
          });
          setCoursework(courseworkResponse.data);

          if (enrolled) {
            const [dashboardResponse, resourcesResponse] = await Promise.all([
              getStudentCourseDashboard(id),
              listResources({ course_id: id }),
            ]);
            setDashboard(dashboardResponse.data);
            setResources(resourcesResponse.data);
          }
        } else if (user?.role === "instructor" || user?.role === "admin") {
          const resourcesResponse = await listResources({ course_id: id });
          setResources(resourcesResponse.data);
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load course");
      }
    };

    void load();
  }, [id, user?.role]);

  const courseAssignments = useMemo(
    () => coursework?.assignments ?? course?.assignments ?? [],
    [coursework, course]
  );

  const courseQuizzes = useMemo(
    () => coursework?.quizzes ?? course?.quizzes ?? [],
    [coursework, course]
  );

  const handleEnroll = async () => {
    if (!id) return;
    setIsEnrolling(true);
    setStatus(null);
    try {
      await enrollInCourse(id);
      setIsEnrolled(true);
      const [dashboardResponse, resourcesResponse, courseworkResponse] = await Promise.all([
        getStudentCourseDashboard(id),
        listResources({ course_id: id }),
        listStudentCoursework({ course_id: id }),
      ]);
      setDashboard(dashboardResponse.data);
      setResources(resourcesResponse.data);
      setCoursework(courseworkResponse.data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to enroll");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleMarkLessonComplete = async (lessonId: number) => {
    try {
      await upsertLessonProgress({
        lesson_id: lessonId,
        status: "completed",
        progress_percent: 100,
      });
      if (id) {
        const dashboardResponse = await getStudentCourseDashboard(id);
        setDashboard(dashboardResponse.data);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update progress");
    }
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    const content = submissionContent[assignmentId];
    const file = submissionFile[assignmentId] ?? undefined;
    setSubmittingAssignment((prev) => ({ ...prev, [assignmentId]: true }));
    setStatus(null);
    try {
      await createAssignmentSubmission(assignmentId, { content, file });
      const courseworkResponse = await listStudentCoursework({ course_id: id });
      setCoursework(courseworkResponse.data);
      setSubmissionContent((prev) => ({ ...prev, [assignmentId]: "" }));
      setSubmissionFile((prev) => ({ ...prev, [assignmentId]: null }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to submit assignment");
    } finally {
      setSubmittingAssignment((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleLoadQuizQuestions = async (quizId: number) => {
    if (quizQuestions[quizId]?.length) return;
    try {
      const response = await listQuizQuestions(quizId);
      setQuizQuestions((prev) => ({ ...prev, [quizId]: response.data }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load quiz questions");
    }
  };

  const handleQuizAnswerChange = (
    quizId: number,
    questionId: number,
    value: string | string[]
  ) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [quizId]: {
        ...(prev[quizId] ?? {}),
        [questionId]: value,
      },
    }));
  };

  const handleSubmitQuiz = async (quizId: number) => {
    const answersByQuestion = quizAnswers[quizId] ?? {};
    const payload = Object.entries(answersByQuestion).map(([questionId, answer]) => ({
      question_id: Number(questionId),
      answer,
    }));

    if (!payload.length) {
      setStatus("Add at least one answer before submitting.");
      return;
    }

    setQuizSubmitting((prev) => ({ ...prev, [quizId]: true }));
    setStatus(null);
    try {
      const response = await createQuizAttempt(quizId, { answers: payload });
      setQuizResult((prev) => ({
        ...prev,
        [quizId]: `Score: ${response.data.score ?? "-"}`,
      }));
      const courseworkResponse = await listStudentCoursework({ course_id: id });
      setCoursework(courseworkResponse.data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to submit quiz");
    } finally {
      setQuizSubmitting((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Course Detail</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{course?.title ?? "Loading..."}</h1>
              <p className="text-sm text-slate-400">{course?.description ?? ""}</p>
            </div>
            {user?.role === "student" ? (
              <button
                className="rounded-full bg-lime-300 px-5 py-2 text-xs font-semibold text-slate-900 disabled:opacity-60"
                type="button"
                onClick={() => void handleEnroll()}
                disabled={isEnrolled || isEnrolling}
              >
                {isEnrolled ? "Enrolled" : isEnrolling ? "Enrolling..." : "Enroll"}
              </button>
            ) : null}
          </div>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        {dashboard ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Your progress</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
                <p className="text-2xl font-semibold">
                  {dashboard.progress.completed_lessons}/{dashboard.progress.total_lessons}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average</p>
                <p className="text-2xl font-semibold">{dashboard.progress.average_progress}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resume</p>
                <p className="text-sm font-semibold">
                  {dashboard.resume_lesson?.lesson?.title ?? "No lesson in progress"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dashboard.modules.map((module) => (
                <div key={module.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold">{module.title}</p>
                  <p className="text-xs text-slate-500">
                    {module.completed_lessons}/{module.total_lessons} lessons · {module.average_progress}% avg
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
                      {lesson.is_published ? (
                        <Link className="text-slate-200" href={`/courses/${id}/lessons/${lesson.id}`}>
                          {lesson.title}
                        </Link>
                      ) : (
                        <span>{lesson.title}</span>
                      )}
                      {lesson.is_published ? (
                        <span className="text-xs text-lime-300">Published</span>
                      ) : (
                        <span className="text-xs text-slate-500">Draft</span>
                      )}
                      {user?.role === "student" && isEnrolled && lesson.is_published ? (
                        <button
                          className="rounded-full border border-slate-700 px-3 py-1 text-[10px]"
                          type="button"
                          onClick={() => void handleMarkLessonComplete(lesson.id)}
                        >
                          Mark complete
                        </button>
                      ) : null}
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

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Resources</h2>
            <div className="mt-4 space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div>
                    <p className="text-sm font-semibold">{resource.title}</p>
                    <p className="text-xs text-slate-500">{resource.type}</p>
                  </div>
                  <a
                    className="text-xs text-lime-300"
                    href={resourceDownloadUrl(resource.id)}
                  >
                    Download
                  </a>
                </div>
              ))}
              {!resources.length && (
                <p className="text-sm text-slate-400">
                  {isEnrolled || user?.role !== "student"
                    ? "No resources uploaded yet."
                    : "Enroll to access resources."}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Assignments</h2>
            <div className="mt-4 space-y-4">
              {courseAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{assignment.title}</p>
                    {"status" in assignment ? (
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {assignment.status}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">Due {assignment.due_at ?? "-"}</p>
                  {user?.role === "student" && isEnrolled ? (
                    <div className="mt-3 grid gap-2">
                      <textarea
                        className="min-h-[80px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                        value={submissionContent[assignment.id] ?? ""}
                        onChange={(event) =>
                          setSubmissionContent((prev) => ({
                            ...prev,
                            [assignment.id]: event.target.value,
                          }))
                        }
                        placeholder="Submission notes (optional)"
                      />
                      <input
                        className="text-xs"
                        type="file"
                        onChange={(event) =>
                          setSubmissionFile((prev) => ({
                            ...prev,
                            [assignment.id]: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      <button
                        className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                        type="button"
                        onClick={() => void handleSubmitAssignment(assignment.id)}
                        disabled={submittingAssignment[assignment.id]}
                      >
                        {submittingAssignment[assignment.id] ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!courseAssignments.length && (
                <p className="text-sm text-slate-400">No assignments yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">Quizzes</h2>
          <div className="mt-4 space-y-4">
            {courseQuizzes.map((quiz) => (
              <div key={quiz.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{quiz.title}</p>
                    {"attempts_used" in quiz ? (
                      <p className="text-xs text-slate-500">
                        Attempts {quiz.attempts_used}/{quiz.max_attempts ?? "-"}
                      </p>
                    ) : null}
                  </div>
                  {user?.role === "student" && isEnrolled ? (
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => void handleLoadQuizQuestions(quiz.id)}
                    >
                      Load questions
                    </button>
                  ) : null}
                </div>
                {quizQuestions[quiz.id]?.length ? (
                  <div className="mt-3 space-y-3">
                    {quizQuestions[quiz.id].map((question) => (
                      <div key={question.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <p className="text-sm font-semibold">{question.question_text}</p>
                        {question.question_type === "essay" ? (
                          <textarea
                            className="mt-2 min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                            value={(quizAnswers[quiz.id]?.[question.id] as string) ?? ""}
                            onChange={(event) =>
                              handleQuizAnswerChange(quiz.id, question.id, event.target.value)
                            }
                          />
                        ) : question.question_type === "multiple_choice" ? (
                          <div className="mt-2 grid gap-2 text-xs">
                            {(question.options ?? []).map((option) => {
                              const current =
                                (quizAnswers[quiz.id]?.[question.id] as string[]) ?? [];
                              const checked = current.includes(option);
                              return (
                                <label key={option} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      const next = event.target.checked
                                        ? [...current, option]
                                        : current.filter((value) => value !== option);
                                      handleQuizAnswerChange(quiz.id, question.id, next);
                                    }}
                                  />
                                  {option}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-2 grid gap-2 text-xs">
                            {(question.question_type === "true_false"
                              ? ["true", "false"]
                              : question.options ?? [])
                              .map((option) => (
                                <label key={option} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`quiz-${quiz.id}-question-${question.id}`}
                                    checked={quizAnswers[quiz.id]?.[question.id] === option}
                                    onChange={() =>
                                      handleQuizAnswerChange(quiz.id, question.id, option)
                                    }
                                  />
                                  {option}
                                </label>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                        type="button"
                        onClick={() => void handleSubmitQuiz(quiz.id)}
                        disabled={quizSubmitting[quiz.id]}
                      >
                        {quizSubmitting[quiz.id] ? "Submitting..." : "Submit quiz"}
                      </button>
                      {quizResult[quiz.id] ? (
                        <span className="text-xs text-lime-300">{quizResult[quiz.id]}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {!courseQuizzes.length && (
              <p className="text-sm text-slate-400">No quizzes yet.</p>
            )}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

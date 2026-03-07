"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { getCourse } from "@/lib/courses";
import { listEnrollments } from "@/lib/enrollments";
import { listResources, resourceDownloadUrl } from "@/lib/resources";
import { createAssignmentSubmission } from "@/lib/submissions";
import { listQuizQuestions } from "@/lib/quiz-questions";
import { createQuizAttempt } from "@/lib/quiz-attempts";
import { upsertLessonProgress } from "@/lib/student";
import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Course, Lesson, Module, QuizQuestion, Resource } from "@/lib/types";

export default function LessonPlayerPage() {
  const params = useParams();
  const courseId = Number(params?.id);
  const lessonId = Number(params?.lessonId);
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [progress, setProgress] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isManualProgress, setIsManualProgress] = useState(false);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
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
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!courseId || !lessonId || Number.isNaN(courseId) || Number.isNaN(lessonId)) return;

    const load = async () => {
      try {
        const response = await getCourse(courseId);
        const data = response.data;
        setCourse(data);

        let foundLesson: Lesson | null = null;
        let foundModule: Module | null = null;
        data.modules?.forEach((item) => {
          const match = item.lessons?.find((child) => child.id === lessonId) ?? null;
          if (match) {
            foundLesson = match;
            foundModule = item;
          }
        });
        setLesson(foundLesson);
        setModule(foundModule);

        const resourcesResponse = await listResources({ lesson_id: lessonId });
        setResources(resourcesResponse.data);

        if (user?.role === "student") {
          const enrollmentResponse = await listEnrollments();
          const enrolled = enrollmentResponse.data.some((item) => item.course_id === courseId);
          setIsEnrolled(enrolled);
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load lesson");
      }
    };

    void load();
  }, [courseId, lessonId, user?.role]);

  const safeProgress = useMemo(() => Math.min(Math.max(progress, 0), 100), [progress]);
  const isDirectVideo = useMemo(() => {
    const url = lesson?.video_url ?? "";
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  }, [lesson]);

  const handleSaveProgress = async (nextStatus: "in_progress" | "completed") => {
    if (!lesson) return;
    try {
      await upsertLessonProgress({
        lesson_id: lesson.id,
        status: nextStatus,
        progress_percent: nextStatus === "completed" ? 100 : safeProgress,
      });
      setStatus("Progress saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update progress");
    }
  };

  useEffect(() => {
    if (!lesson || isManualProgress) return;

    const handleScroll = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = Math.max(rect.height - viewport, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const percent = Math.round((scrolled / total) * 100);
      setProgress(percent);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lesson, isManualProgress]);

  useEffect(() => {
    if (!lesson) return;
    if (Math.abs(safeProgress - lastSavedProgress) < 5 && safeProgress < 100) return;

    const timeout = window.setTimeout(() => {
      void handleSaveProgress(safeProgress >= 100 ? "completed" : "in_progress");
      setLastSavedProgress(safeProgress);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [lesson, safeProgress, lastSavedProgress]);

  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isManualProgress) return;
    const element = event.currentTarget;
    if (!element.duration) return;
    const percent = Math.round((element.currentTime / element.duration) * 100);
    setProgress(percent);
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    const content = submissionContent[assignmentId];
    const file = submissionFile[assignmentId] ?? undefined;
    setSubmittingAssignment((prev) => ({ ...prev, [assignmentId]: true }));
    setStatus(null);
    try {
      await createAssignmentSubmission(assignmentId, { content, file });
      setSubmissionContent((prev) => ({ ...prev, [assignmentId]: "" }));
      setSubmissionFile((prev) => ({ ...prev, [assignmentId]: null }));
      setStatus("Assignment submitted.");
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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lesson</p>
          <h1 className="text-3xl font-semibold">{lesson?.title ?? "Lesson"}</h1>
          <p className="text-sm text-slate-400">
            {course?.title ?? ""} {module ? `· ${module.title}` : ""}
          </p>
          <Link className="text-xs text-amber-300" href={`/courses/${courseId}`}>
            Back to course
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        {lesson ? (
          <Panel>
            <div className="space-y-4" ref={contentRef}>
              {lesson.video_url ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                  {isDirectVideo ? (
                    <video
                      className="h-full w-full"
                      src={lesson.video_url}
                      controls
                      onTimeUpdate={handleVideoTimeUpdate}
                    />
                  ) : (
                    <iframe
                      className="h-full w-full"
                      src={lesson.video_url}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : null}
              <article className="prose prose-invert max-w-none text-sm">
                {lesson.content ?? "No content yet."}
              </article>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <label className="grid gap-2 text-xs text-slate-400">
                Progress %
                <input
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  max={100}
                  value={safeProgress}
                  onFocus={() => setIsManualProgress(true)}
                  onBlur={() => setIsManualProgress(false)}
                  onChange={(event) => setProgress(Number(event.target.value))}
                />
              </label>
              <Button
                type="button"
                className="px-4 py-2 text-xs"
                onClick={() => void handleSaveProgress("in_progress")}
              >
                Save progress
              </Button>
              <Button
                type="button"
                variant="primary"
                className="px-4 py-2 text-xs"
                onClick={() => void handleSaveProgress("completed")}
              >
                Mark complete
              </Button>
            </div>
          </Panel>
        ) : (
          <p className="text-sm text-slate-400">Lesson not found.</p>
        )}

        <Panel>
          <h2 className="text-lg font-semibold">Lesson resources</h2>
          <div className="mt-4 space-y-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-semibold">{resource.title}</p>
                  <p className="text-xs text-slate-500">{resource.type}</p>
                </div>
                <a className="text-xs text-amber-300" href={resourceDownloadUrl(resource.id)}>
                  Download
                </a>
              </Card>
            ))}
            {!resources.length && <p className="text-sm text-slate-400">No resources yet.</p>}
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <h2 className="text-lg font-semibold">Lesson assignments</h2>
            <div className="mt-4 space-y-4">
              {(course?.assignments ?? [])
                .filter((assignment) => assignment.lesson_id === lessonId)
                .map((assignment) => (
                  <Card key={assignment.id} className="p-4">
                    <p className="text-sm font-semibold">{assignment.title}</p>
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
                        <Button
                          type="button"
                          className="px-4 py-2 text-xs"
                          onClick={() => void handleSubmitAssignment(assignment.id)}
                          disabled={submittingAssignment[assignment.id]}
                        >
                          {submittingAssignment[assignment.id] ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                ))}
              {(course?.assignments ?? []).filter((assignment) => assignment.lesson_id === lessonId)
                .length === 0 ? (
                <p className="text-sm text-slate-400">No assignments for this lesson.</p>
              ) : null}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">Lesson quizzes</h2>
            <div className="mt-4 space-y-4">
              {(course?.quizzes ?? [])
                .filter((quiz) => quiz.lesson_id === lessonId)
                .map((quiz) => (
                  <Card key={quiz.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{quiz.title}</p>
                      {user?.role === "student" && isEnrolled ? (
                        <Button
                          type="button"
                          className="px-4 py-2 text-xs"
                          onClick={() => void handleLoadQuizQuestions(quiz.id)}
                        >
                          Load questions
                        </Button>
                      ) : null}
                    </div>
                    {quizQuestions[quiz.id]?.length ? (
                      <div className="mt-3 space-y-3">
                        {quizQuestions[quiz.id].map((question) => (
                          <Card key={question.id} className="p-3">
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
                          </Card>
                        ))}
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            className="px-4 py-2 text-xs"
                            onClick={() => void handleSubmitQuiz(quiz.id)}
                            disabled={quizSubmitting[quiz.id]}
                          >
                            {quizSubmitting[quiz.id] ? "Submitting..." : "Submit quiz"}
                          </Button>
                          {quizResult[quiz.id] ? (
                            <span className="text-xs text-amber-300">{quizResult[quiz.id]}</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </Card>
                ))}
              {(course?.quizzes ?? []).filter((quiz) => quiz.lesson_id === lessonId).length ===
              0 ? (
                <p className="text-sm text-slate-400">No quizzes for this lesson.</p>
              ) : null}
            </div>
          </Panel>
        </section>
      </main>
    </RequireAuth>
  );
}

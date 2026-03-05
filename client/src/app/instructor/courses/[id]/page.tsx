"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  getCourse,
  reorderLessons,
  reorderModules,
  updateLesson,
  updateModule,
} from "@/lib/courses";
import {
  createAssignment,
  createQuiz,
  deleteAssignment,
  deleteQuiz,
  updateAssignment,
  updateQuiz,
} from "@/lib/assessments";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  listQuizQuestions,
  reorderQuizQuestions,
  updateQuizQuestion,
} from "@/lib/quiz-questions";
import { RequireRole } from "@/components/require-role";
import type { Assignment, Course, Lesson, Module, Quiz, QuizQuestion } from "@/lib/types";

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
  const [lessonContent, setLessonContent] = useState<Record<number, string>>({});
  const [lessonPublish, setLessonPublish] = useState<Record<number, boolean>>({});
  const [moduleOrder, setModuleOrder] = useState<number[]>([]);
  const [lessonOrder, setLessonOrder] = useState<Record<number, number[]>>({});
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDueAt, setAssignmentDueAt] = useState("");
  const [assignmentMaxPoints, setAssignmentMaxPoints] = useState(100);
  const [assignmentPublished, setAssignmentPublished] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Record<number, string>>({});
  const [quizTitle, setQuizTitle] = useState("");
  const [quizMaxAttempts, setQuizMaxAttempts] = useState(1);
  const [quizTimeLimit, setQuizTimeLimit] = useState("");
  const [quizPublished, setQuizPublished] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Record<number, string>>({});
  const [draggingModuleId, setDraggingModuleId] = useState<number | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<number | null>(null);
  const [draggingLesson, setDraggingLesson] = useState<{ moduleId: number; lessonId: number } | null>(
    null
  );
  const [dragOverLesson, setDragOverLesson] = useState<{ moduleId: number; lessonId: number } | null>(
    null
  );
  const [quizQuestions, setQuizQuestions] = useState<Record<number, QuizQuestion[]>>({});
  const [questionOrder, setQuestionOrder] = useState<Record<number, number[]>>({});
  const [expandedQuiz, setExpandedQuiz] = useState<Record<number, boolean>>({});
  const [questionText, setQuestionText] = useState<Record<number, string>>({});
  const [questionType, setQuestionType] = useState<Record<number, QuizQuestion["question_type"]>>({});
  const [questionPoints, setQuestionPoints] = useState<Record<number, number>>({});
  const [questionOptions, setQuestionOptions] = useState<Record<number, string>>({});
  const [questionAnswer, setQuestionAnswer] = useState<Record<number, string>>({});
  const [editingQuestion, setEditingQuestion] = useState<Record<number, string>>({});
  const [editingQuestionOptions, setEditingQuestionOptions] = useState<Record<number, string>>({});
  const [editingQuestionAnswer, setEditingQuestionAnswer] = useState<Record<number, string>>({});
  const [editingQuestionPoints, setEditingQuestionPoints] = useState<Record<number, number>>({});
  const [editingQuestionType, setEditingQuestionType] = useState<
    Record<number, QuizQuestion["question_type"]>
  >({});
  const [draggingQuestion, setDraggingQuestion] = useState<{ quizId: number; questionId: number } | null>(
    null
  );
  const [dragOverQuestion, setDragOverQuestion] = useState<{ quizId: number; questionId: number } | null>(
    null
  );

  const moduleCount = useMemo(() => course?.modules?.length ?? 0, [course]);

  const load = async () => {
    if (!id || Number.isNaN(id)) return;

    try {
      const response = await getCourse(id);
      const data = response.data;
      setCourse(data);

      const sortedModules = [...(data.modules ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      setModuleOrder(sortedModules.map((module) => module.id));

      const nextLessonOrder: Record<number, number[]> = {};
      sortedModules.forEach((module) => {
        nextLessonOrder[module.id] = [...(module.lessons ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((lesson) => lesson.id);
      });
      setLessonOrder(nextLessonOrder);
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

  const handleDeleteModule = async (module: Module) => {
    const confirmed = window.confirm(`Delete module "${module.title}" and its lessons?`);
    if (!confirmed) return;

    try {
      await deleteModule(module.id);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete module");
    }
  };

  const handleMoveModule = async (moduleId: number, direction: "up" | "down") => {
    if (!course?.modules) return;

    const ordered = [...course.modules].sort((a, b) => a.sort_order - b.sort_order);
    const index = ordered.findIndex((module) => module.id === moduleId);
    if (index === -1) return;

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;

    const ids = ordered.map((module) => module.id);
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    try {
      await reorderModules(moduleId, ids);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reorder modules");
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

  const handleUpdateLessonContent = async (lesson: Lesson) => {
    const content = lessonContent[lesson.id] ?? lesson.content ?? "";
    const isPublished = lessonPublish[lesson.id] ?? lesson.is_published;

    try {
      await updateLesson(lesson.id, { content, is_published: isPublished });
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update lesson");
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    const next = !(lessonPublish[lesson.id] ?? lesson.is_published);
    setLessonPublish((prev) => ({ ...prev, [lesson.id]: next }));

    try {
      await updateLesson(lesson.id, { is_published: next });
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update lesson");
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    const confirmed = window.confirm(`Delete lesson "${lesson.title}"?`);
    if (!confirmed) return;

    try {
      await deleteLesson(lesson.id);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete lesson");
    }
  };

  const handleMoveLesson = async (module: Module, lessonId: number, direction: "up" | "down") => {
    if (!module.lessons) return;

    const ordered = [...module.lessons].sort((a, b) => a.sort_order - b.sort_order);
    const index = ordered.findIndex((lesson) => lesson.id === lessonId);
    if (index === -1) return;

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;

    const ids = ordered.map((lesson) => lesson.id);
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    try {
      await reorderLessons(module.id, ids);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reorder lessons");
    }
  };

  const handleCreateAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setStatus(null);

    try {
      await createAssignment(id, {
        title: assignmentTitle,
        due_at: assignmentDueAt || undefined,
        max_points: assignmentMaxPoints,
        is_published: assignmentPublished,
      });
      setAssignmentTitle("");
      setAssignmentDueAt("");
      setAssignmentMaxPoints(100);
      setAssignmentPublished(false);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create assignment");
    }
  };

  const handleUpdateAssignment = async (assignment: Assignment) => {
    const title = editingAssignment[assignment.id];
    if (!title) return;

    try {
      await updateAssignment(assignment.id, { title });
      setEditingAssignment((prev) => ({ ...prev, [assignment.id]: "" }));
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update assignment");
    }
  };

  const handleToggleAssignmentPublish = async (assignment: Assignment) => {
    const next = !assignment.is_published;
    try {
      await updateAssignment(assignment.id, { is_published: next });
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    const confirmed = window.confirm(`Delete assignment "${assignment.title}"?`);
    if (!confirmed) return;

    try {
      await deleteAssignment(assignment.id);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete assignment");
    }
  };

  const handleCreateQuiz = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setStatus(null);

    const maxAttempts = quizMaxAttempts ? Math.max(1, quizMaxAttempts) : undefined;
    const timeLimit = quizTimeLimit ? Number(quizTimeLimit) : undefined;

    try {
      await createQuiz(id, {
        title: quizTitle,
        max_attempts: maxAttempts,
        time_limit_minutes: timeLimit,
        is_published: quizPublished,
      });
      setQuizTitle("");
      setQuizMaxAttempts(1);
      setQuizTimeLimit("");
      setQuizPublished(false);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create quiz");
    }
  };

  const handleUpdateQuiz = async (quiz: Quiz) => {
    const title = editingQuiz[quiz.id];
    if (!title) return;

    try {
      await updateQuiz(quiz.id, { title });
      setEditingQuiz((prev) => ({ ...prev, [quiz.id]: "" }));
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update quiz");
    }
  };

  const handleToggleQuizPublish = async (quiz: Quiz) => {
    const next = !quiz.is_published;
    try {
      await updateQuiz(quiz.id, { is_published: next });
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update quiz");
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    const confirmed = window.confirm(`Delete quiz "${quiz.title}"?`);
    if (!confirmed) return;

    try {
      await deleteQuiz(quiz.id);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete quiz");
    }
  };

  const parseCsvList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const toggleQuizQuestions = async (quiz: Quiz) => {
    const next = !(expandedQuiz[quiz.id] ?? false);
    setExpandedQuiz((prev) => ({ ...prev, [quiz.id]: next }));
    if (!next) return;

    if (!quizQuestions[quiz.id]) {
      try {
        const response = await listQuizQuestions(quiz.id);
        const questions = response.data;
        setQuizQuestions((prev) => ({ ...prev, [quiz.id]: questions }));
        setQuestionOrder((prev) => ({
          ...prev,
          [quiz.id]: questions.map((question) => question.id),
        }));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load quiz questions");
      }
    }
  };

  const handleCreateQuestion = async (quiz: Quiz) => {
    const text = questionText[quiz.id];
    if (!text) return;

    const type = questionType[quiz.id] ?? "multiple_choice";
    const points = questionPoints[quiz.id] ?? 1;
    const options = parseCsvList(questionOptions[quiz.id] ?? "");
    const answer = parseCsvList(questionAnswer[quiz.id] ?? "");

    try {
      const response = await createQuizQuestion(quiz.id, {
        question_text: text,
        question_type: type,
        points,
        options: options.length ? options : undefined,
        correct_answer: answer.length ? answer : undefined,
      });

      setQuestionText((prev) => ({ ...prev, [quiz.id]: "" }));
      setQuestionOptions((prev) => ({ ...prev, [quiz.id]: "" }));
      setQuestionAnswer((prev) => ({ ...prev, [quiz.id]: "" }));
      setQuestionPoints((prev) => ({ ...prev, [quiz.id]: 1 }));

      setQuizQuestions((prev) => ({
        ...prev,
        [quiz.id]: [...(prev[quiz.id] ?? []), response.data],
      }));
      setQuestionOrder((prev) => ({
        ...prev,
        [quiz.id]: [...(prev[quiz.id] ?? []), response.data.id],
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create question");
    }
  };

  const handleUpdateQuestion = async (quizId: number, question: QuizQuestion) => {
    const text = editingQuestion[question.id] ?? question.question_text;
    const type = editingQuestionType[question.id] ?? question.question_type;
    const points = editingQuestionPoints[question.id] ?? question.points;
    const optionsInput = editingQuestionOptions[question.id];
    const answerInput = editingQuestionAnswer[question.id];

    if (!text) return;

    const payload: Partial<QuizQuestion> = {
      question_text: text,
      question_type: type,
      points,
    };

    if (optionsInput && optionsInput.trim().length > 0) {
      payload.options = parseCsvList(optionsInput);
    }

    if (answerInput && answerInput.trim().length > 0) {
      payload.correct_answer = parseCsvList(answerInput);
    }

    try {
      const response = await updateQuizQuestion(question.id, payload);
      setEditingQuestion((prev) => ({ ...prev, [question.id]: "" }));
      setEditingQuestionOptions((prev) => ({ ...prev, [question.id]: "" }));
      setEditingQuestionAnswer((prev) => ({ ...prev, [question.id]: "" }));
      setQuizQuestions((prev) => ({
        ...prev,
        [quizId]: (prev[quizId] ?? []).map((item) =>
          item.id === question.id ? response.data : item
        ),
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update question");
    }
  };

  const handleDeleteQuestion = async (quizId: number, question: QuizQuestion) => {
    const confirmed = window.confirm("Delete this question?");
    if (!confirmed) return;

    try {
      await deleteQuizQuestion(question.id);
      setQuizQuestions((prev) => ({
        ...prev,
        [quizId]: (prev[quizId] ?? []).filter((item) => item.id !== question.id),
      }));
      setQuestionOrder((prev) => ({
        ...prev,
        [quizId]: (prev[quizId] ?? []).filter((id) => id !== question.id),
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete question");
    }
  };

  const orderedQuestions = (quizId: number) => {
    const questions = quizQuestions[quizId] ?? [];
    if (!questions.length) return [];

    const map = new Map(questions.map((question) => [question.id, question]));
    const ids = questionOrder[quizId] ?? questions.map((question) => question.id);
    return ids.map((id) => map.get(id)).filter(Boolean) as QuizQuestion[];
  };

  const handleQuestionDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    quizId: number,
    questionId: number
  ) => {
    event.dataTransfer.setData("text/plain", `question:${quizId}:${questionId}`);
    setDraggingQuestion({ quizId, questionId });
  };

  const handleQuestionDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    quizId: number,
    targetId: number
  ) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload.startsWith("question:")) return;

    const [, payloadQuizId, payloadQuestionId] = payload.split(":");
    const sourceQuizId = Number(payloadQuizId);
    const sourceQuestionId = Number(payloadQuestionId);
    if (!sourceQuizId || !sourceQuestionId) return;
    if (sourceQuizId !== quizId) return;
    if (sourceQuestionId === targetId) return;

    const order = questionOrder[quizId] ?? orderedQuestions(quizId).map((item) => item.id);
    const nextOrder = moveItem(order, sourceQuestionId, targetId);
    setQuestionOrder((prev) => ({ ...prev, [quizId]: nextOrder }));

    try {
      await reorderQuizQuestions(quizId, nextOrder);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reorder questions");
    } finally {
      setDragOverQuestion(null);
      setDraggingQuestion(null);
    }
  };

  const moveItem = (order: number[], fromId: number, toId: number) => {
    const fromIndex = order.indexOf(fromId);
    const toIndex = order.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return order;

    const next = [...order];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, fromId);
    return next;
  };

  const orderedModules = useMemo(() => {
    const modules = course?.modules ?? [];
    if (!modules.length) return [];

    const map = new Map(modules.map((module) => [module.id, module]));
    const ids = moduleOrder.length
      ? moduleOrder
      : [...modules].sort((a, b) => a.sort_order - b.sort_order).map((module) => module.id);

    return ids.map((id) => map.get(id)).filter(Boolean) as Module[];
  }, [course, moduleOrder]);

  const getOrderedLessons = (module: Module) => {
    const lessons = module.lessons ?? [];
    if (!lessons.length) return [];

    const map = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    const ids = lessonOrder[module.id]
      ? lessonOrder[module.id]
      : [...lessons].sort((a, b) => a.sort_order - b.sort_order).map((lesson) => lesson.id);

    return ids.map((id) => map.get(id)).filter(Boolean) as Lesson[];
  };

  const handleModuleDragStart = (event: React.DragEvent<HTMLDivElement>, moduleId: number) => {
    event.dataTransfer.setData("text/plain", `module:${moduleId}`);
    setDraggingModuleId(moduleId);
  };

  const handleModuleDrop = async (event: React.DragEvent<HTMLDivElement>, targetId: number) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload.startsWith("module:")) return;

    const sourceId = Number(payload.split(":")[1]);
    if (!sourceId || sourceId === targetId) return;

    const nextOrder = moveItem(
      moduleOrder.length ? moduleOrder : orderedModules.map((module) => module.id),
      sourceId,
      targetId
    );
    setModuleOrder(nextOrder);

    try {
      await reorderModules(targetId, nextOrder);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reorder modules");
    } finally {
      setDragOverModuleId(null);
      setDraggingModuleId(null);
    }
  };

  const handleLessonDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    moduleId: number,
    lessonId: number
  ) => {
    event.dataTransfer.setData("text/plain", `lesson:${moduleId}:${lessonId}`);
    setDraggingLesson({ moduleId, lessonId });
  };

  const handleLessonDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    module: Module,
    targetId: number
  ) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload.startsWith("lesson:")) return;

    const [, payloadModuleId, payloadLessonId] = payload.split(":");
    const sourceModuleId = Number(payloadModuleId);
    const sourceLessonId = Number(payloadLessonId);
    if (!sourceModuleId || !sourceLessonId) return;
    if (sourceModuleId !== module.id) return;
    if (sourceLessonId === targetId) return;

    const order = lessonOrder[module.id] ?? getOrderedLessons(module).map((lesson) => lesson.id);
    const nextOrder = moveItem(order, sourceLessonId, targetId);
    setLessonOrder((prev) => ({ ...prev, [module.id]: nextOrder }));

    try {
      await reorderLessons(module.id, nextOrder);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reorder lessons");
    } finally {
      setDragOverLesson(null);
      setDraggingLesson(null);
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
          {orderedModules.map((module) => (
            <div
              key={module.id}
              className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition ${
                dragOverModuleId === module.id ? "ring-2 ring-lime-300/40" : ""
              } ${draggingModuleId === module.id ? "opacity-70" : ""}`}
              draggable
              onDragStart={(event) => handleModuleDragStart(event, module.id)}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverModuleId(module.id);
              }}
              onDragEnd={() => {
                setDragOverModuleId(null);
                setDraggingModuleId(null);
              }}
              onDrop={(event) => void handleModuleDrop(event, module.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="cursor-grab text-sm text-slate-500">::</span>
                    <h3 className="text-lg font-semibold">{module.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{module.description ?? "No description"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                  <button
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                    type="button"
                    onClick={() => void handleMoveModule(module.id, "up")}
                  >
                    Move up
                  </button>
                  <button
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                    type="button"
                    onClick={() => void handleMoveModule(module.id, "down")}
                  >
                    Move down
                  </button>
                  <button
                    className="rounded-full border border-rose-500/40 px-4 py-2 text-xs text-rose-200"
                    type="button"
                    onClick={() => void handleDeleteModule(module)}
                  >
                    Delete
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
                  {getOrderedLessons(module).map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 transition ${
                        dragOverLesson?.lessonId === lesson.id && dragOverLesson?.moduleId === module.id
                          ? "ring-2 ring-lime-300/30"
                          : ""
                      } ${
                        draggingLesson?.lessonId === lesson.id && draggingLesson?.moduleId === module.id
                          ? "opacity-70"
                          : ""
                      }`}
                      draggable
                      onDragStart={(event) => handleLessonDragStart(event, module.id, lesson.id)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverLesson({ moduleId: module.id, lessonId: lesson.id });
                      }}
                      onDragEnd={() => {
                        setDragOverLesson(null);
                        setDraggingLesson(null);
                      }}
                      onDrop={(event) => void handleLessonDrop(event, module, lesson.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="cursor-grab text-xs text-slate-500">::</span>
                          <p className="text-sm font-medium">{lesson.title}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {lesson.is_published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                        <button
                          className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                          type="button"
                          onClick={() => void handleMoveLesson(module, lesson.id, "up")}
                        >
                          Move up
                        </button>
                        <button
                          className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                          type="button"
                          onClick={() => void handleMoveLesson(module, lesson.id, "down")}
                        >
                          Move down
                        </button>
                        <button
                          className="rounded-full border border-rose-500/40 px-4 py-2 text-xs text-rose-200"
                          type="button"
                          onClick={() => void handleDeleteLesson(lesson)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={lessonPublish[lesson.id] ?? lesson.is_published}
                          onChange={() => void handleTogglePublish(lesson)}
                        />
                        Published
                      </label>
                      <textarea
                        className="min-h-[120px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                        value={lessonContent[lesson.id] ?? lesson.content ?? ""}
                        onChange={(event) =>
                          setLessonContent((prev) => ({ ...prev, [lesson.id]: event.target.value }))
                        }
                        placeholder="Lesson content"
                      />
                      <div>
                        <button
                          className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                          type="button"
                          onClick={() => void handleUpdateLessonContent(lesson)}
                        >
                          Save content
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

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Assignments</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleCreateAssignment}>
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={assignmentTitle}
                onChange={(event) => setAssignmentTitle(event.target.value)}
                placeholder="Assignment title"
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={assignmentDueAt}
                  onChange={(event) => setAssignmentDueAt(event.target.value)}
                  type="date"
                />
                <input
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={assignmentMaxPoints}
                  onChange={(event) => setAssignmentMaxPoints(Number(event.target.value))}
                  type="number"
                  min={1}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={assignmentPublished}
                  onChange={(event) => setAssignmentPublished(event.target.checked)}
                />
                Published
              </label>
              <button
                className="rounded-full bg-lime-300 px-5 py-2 text-xs font-semibold text-slate-900"
                type="submit"
              >
                Create assignment
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {(course?.assignments ?? []).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{assignment.title}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.is_published ? "Published" : "Draft"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                      value={editingAssignment[assignment.id] ?? ""}
                      onChange={(event) =>
                        setEditingAssignment((prev) => ({
                          ...prev,
                          [assignment.id]: event.target.value,
                        }))
                      }
                      placeholder="Rename"
                    />
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => void handleUpdateAssignment(assignment)}
                    >
                      Save
                    </button>
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => void handleToggleAssignmentPublish(assignment)}
                    >
                      Toggle publish
                    </button>
                    <button
                      className="rounded-full border border-rose-500/40 px-4 py-2 text-xs text-rose-200"
                      type="button"
                      onClick={() => void handleDeleteAssignment(assignment)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!(course?.assignments ?? []).length && (
                <p className="text-sm text-slate-400">No assignments yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Quizzes</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleCreateQuiz}>
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={quizTitle}
                onChange={(event) => setQuizTitle(event.target.value)}
                placeholder="Quiz title"
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={quizMaxAttempts}
                  onChange={(event) => setQuizMaxAttempts(Number(event.target.value))}
                  type="number"
                  min={1}
                />
                <input
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={quizTimeLimit}
                  onChange={(event) => setQuizTimeLimit(event.target.value)}
                  type="number"
                  min={1}
                  placeholder="Time limit (min)"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={quizPublished}
                  onChange={(event) => setQuizPublished(event.target.checked)}
                />
                Published
              </label>
              <button
                className="rounded-full bg-lime-300 px-5 py-2 text-xs font-semibold text-slate-900"
                type="submit"
              >
                Create quiz
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {(course?.quizzes ?? []).map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      {quiz.is_published ? "Published" : "Draft"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                      value={editingQuiz[quiz.id] ?? ""}
                      onChange={(event) =>
                        setEditingQuiz((prev) => ({
                          ...prev,
                          [quiz.id]: event.target.value,
                        }))
                      }
                      placeholder="Rename"
                    />
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => void handleUpdateQuiz(quiz)}
                    >
                      Save
                    </button>
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => void handleToggleQuizPublish(quiz)}
                    >
                      Toggle publish
                    </button>
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => void toggleQuizQuestions(quiz)}
                    >
                      Questions
                    </button>
                    <button
                      className="rounded-full border border-rose-500/40 px-4 py-2 text-xs text-rose-200"
                      type="button"
                      onClick={() => void handleDeleteQuiz(quiz)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {expandedQuiz[quiz.id] ? (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <h3 className="text-sm font-semibold">Quiz questions</h3>
                    <div className="mt-3 grid gap-3">
                      <input
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                        value={questionText[quiz.id] ?? ""}
                        onChange={(event) =>
                          setQuestionText((prev) => ({ ...prev, [quiz.id]: event.target.value }))
                        }
                        placeholder="Question text"
                      />
                      <div className="grid gap-3 md:grid-cols-3">
                        <select
                          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                          value={questionType[quiz.id] ?? "multiple_choice"}
                          onChange={(event) =>
                            setQuestionType((prev) => ({
                              ...prev,
                              [quiz.id]: event.target.value as QuizQuestion["question_type"],
                            }))
                          }
                        >
                          <option value="multiple_choice">Multiple choice</option>
                          <option value="single_choice">Single choice</option>
                          <option value="true_false">True/False</option>
                          <option value="essay">Essay</option>
                        </select>
                        <input
                          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                          value={questionPoints[quiz.id] ?? 1}
                          onChange={(event) =>
                            setQuestionPoints((prev) => ({
                              ...prev,
                              [quiz.id]: Number(event.target.value),
                            }))
                          type="number"
                          min={1}
                        />
                        <button
                          className="rounded-full bg-lime-300 px-4 py-2 text-xs font-semibold text-slate-900"
                          type="button"
                          onClick={() => void handleCreateQuestion(quiz)}
                        >
                          Add question
                        </button>
                      </div>
                      <input
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                        value={questionOptions[quiz.id] ?? ""}
                        onChange={(event) =>
                          setQuestionOptions((prev) => ({
                            ...prev,
                            [quiz.id]: event.target.value,
                          }))
                        }
                        placeholder="Options (comma separated)"
                      />
                      <input
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                        value={questionAnswer[quiz.id] ?? ""}
                        onChange={(event) =>
                          setQuestionAnswer((prev) => ({
                            ...prev,
                            [quiz.id]: event.target.value,
                          }))
                        }
                        placeholder="Correct answer (comma separated)"
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      {orderedQuestions(quiz.id).map((question) => (
                        <div
                          key={question.id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 ${
                            dragOverQuestion?.quizId === quiz.id &&
                            dragOverQuestion?.questionId === question.id
                              ? "ring-2 ring-lime-300/30"
                              : ""
                          } ${
                            draggingQuestion?.quizId === quiz.id &&
                            draggingQuestion?.questionId === question.id
                              ? "opacity-70"
                              : ""
                          }`}
                          draggable
                          onDragStart={(event) => handleQuestionDragStart(event, quiz.id, question.id)}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOverQuestion({ quizId: quiz.id, questionId: question.id });
                          }}
                          onDragEnd={() => {
                            setDragOverQuestion(null);
                            setDraggingQuestion(null);
                          }}
                          onDrop={(event) => void handleQuestionDrop(event, quiz.id, question.id)}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="cursor-grab text-xs text-slate-500">::</span>
                              <p className="text-sm font-medium">{question.question_text}</p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {question.question_type} · {question.points} pts
                            </p>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              <select
                                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                                value={editingQuestionType[question.id] ?? question.question_type}
                                onChange={(event) =>
                                  setEditingQuestionType((prev) => ({
                                    ...prev,
                                    [question.id]: event.target.value as QuizQuestion["question_type"],
                                  }))
                                }
                              >
                                <option value="multiple_choice">Multiple choice</option>
                                <option value="single_choice">Single choice</option>
                                <option value="true_false">True/False</option>
                                <option value="essay">Essay</option>
                              </select>
                              <input
                                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                                type="number"
                                min={1}
                                value={editingQuestionPoints[question.id] ?? question.points}
                                onChange={(event) =>
                                  setEditingQuestionPoints((prev) => ({
                                    ...prev,
                                    [question.id]: Number(event.target.value),
                                  }))
                                }
                              />
                              <input
                                className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                                value={
                                  editingQuestionOptions[question.id] ??
                                  (question.options ? question.options.join(", ") : "")
                                }
                                onChange={(event) =>
                                  setEditingQuestionOptions((prev) => ({
                                    ...prev,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                placeholder="Options (comma separated)"
                              />
                              <input
                                className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                                value={
                                  editingQuestionAnswer[question.id] ??
                                  (question.correct_answer ? question.correct_answer.join(", ") : "")
                                }
                                onChange={(event) =>
                                  setEditingQuestionAnswer((prev) => ({
                                    ...prev,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                placeholder="Correct answer (comma separated)"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input
                              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                              value={editingQuestion[question.id] ?? ""}
                              onChange={(event) =>
                                setEditingQuestion((prev) => ({
                                  ...prev,
                                  [question.id]: event.target.value,
                                }))
                              }
                              placeholder="Rename"
                            />
                            <button
                              className="rounded-full border border-slate-700 px-4 py-2 text-xs"
                              type="button"
                              onClick={() => void handleUpdateQuestion(quiz.id, question)}
                            >
                              Save
                            </button>
                            <button
                              className="rounded-full border border-rose-500/40 px-4 py-2 text-xs text-rose-200"
                              type="button"
                              onClick={() => void handleDeleteQuestion(quiz.id, question)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {!orderedQuestions(quiz.id).length && (
                        <p className="text-sm text-slate-400">No questions yet.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              ))}
              {!(course?.quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </RequireRole>
  );
}

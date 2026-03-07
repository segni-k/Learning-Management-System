"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  listAssignmentSubmissions,
  submissionDownloadUrl,
  updateAssignmentSubmission,
} from "@/lib/submissions";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  listQuizQuestions,
  reorderQuizQuestions,
  updateQuizQuestion,
} from "@/lib/quiz-questions";
import { listQuizAttempts } from "@/lib/quiz-attempts";
import { listResources, resourceDownloadUrl, uploadResource } from "@/lib/resources";
import { getCourseRosterProgress } from "@/lib/progress";
import { RequireRole } from "@/components/require-role";
import { SectionHeader } from "@/components/ui/section-header";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  Assignment,
  AssignmentSubmission,
  Course,
  CourseRosterProgressRow,
  Lesson,
  Module,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  Resource,
} from "@/lib/types";

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleTakeaways, setModuleTakeaways] = useState<Record<number, string>>({});
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
  const [bulkInput, setBulkInput] = useState<Record<number, string>>({});
  const [bulkErrors, setBulkErrors] = useState<Record<number, string[]>>({});
  const [draggingQuestion, setDraggingQuestion] = useState<{ quizId: number; questionId: number } | null>(
    null
  );
  const [dragOverQuestion, setDragOverQuestion] = useState<{ quizId: number; questionId: number } | null>(
    null
  );
  const [expandedAssignment, setExpandedAssignment] = useState<Record<number, boolean>>({});
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<
    Record<number, AssignmentSubmission[]>
  >({});
  const [gradingScore, setGradingScore] = useState<Record<number, number>>({});
  const [expandedQuizAttempts, setExpandedQuizAttempts] = useState<Record<number, boolean>>({});
  const [quizAttempts, setQuizAttempts] = useState<Record<number, QuizAttempt[]>>({});
  const [showRosterProgress, setShowRosterProgress] = useState(false);
  const [rosterProgress, setRosterProgress] = useState<CourseRosterProgressRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterQuery, setRosterQuery] = useState("");
  const [rosterMinAverage, setRosterMinAverage] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceType, setResourceType] = useState("file");
  const [resourceLessonId, setResourceLessonId] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourcePrivate, setResourcePrivate] = useState(true);
  const [resourceUploading, setResourceUploading] = useState(false);

  const moduleCount = useMemo(() => course?.modules?.length ?? 0, [course]);

  const load = useCallback(async () => {
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

      const resourcesResponse = await listResources({ course_id: id });
      setResources(resourcesResponse.data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load course");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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
    const title = editingModule[module.id]?.trim();
    const takeawaysInput = moduleTakeaways[module.id];
    const payload: Partial<Module> = {};

    if (title) {
      payload.title = title;
    }

    if (takeawaysInput !== undefined) {
      payload.takeaways = parseFlexibleList(takeawaysInput);
    }

    if (!Object.keys(payload).length) return;

    try {
      await updateModule(module.id, payload);
      setEditingModule((prev) => ({ ...prev, [module.id]: "" }));
      setModuleTakeaways((prev) => {
        const next = { ...prev };
        delete next[module.id];
        return next;
      });
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

  const toggleAssignmentSubmissions = async (assignment: Assignment) => {
    const next = !(expandedAssignment[assignment.id] ?? false);
    setExpandedAssignment((prev) => ({ ...prev, [assignment.id]: next }));
    if (!next) return;

    if (!assignmentSubmissions[assignment.id]) {
      try {
        const response = await listAssignmentSubmissions(assignment.id);
        setAssignmentSubmissions((prev) => ({ ...prev, [assignment.id]: response.data }));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load submissions");
      }
    }
  };

  const handleGradeSubmission = async (assignmentId: number, submissionId: number) => {
    const score = gradingScore[submissionId];
    if (score === undefined) return;
    try {
      const response = await updateAssignmentSubmission(submissionId, { score });
      setAssignmentSubmissions((prev) => ({
        ...prev,
        [assignmentId]: (prev[assignmentId] ?? []).map((item) =>
          item.id === submissionId ? response.data : item
        ),
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to grade submission");
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

  const toggleQuizAttempts = async (quiz: Quiz) => {
    const next = !(expandedQuizAttempts[quiz.id] ?? false);
    setExpandedQuizAttempts((prev) => ({ ...prev, [quiz.id]: next }));
    if (!next) return;

    if (!quizAttempts[quiz.id]) {
      try {
        const response = await listQuizAttempts(quiz.id);
        setQuizAttempts((prev) => ({ ...prev, [quiz.id]: response.data }));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load quiz attempts");
      }
    }
  };

  const parseCsvList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const parseFlexibleList = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const delimiter = trimmed.includes(";") ? ";" : ",";
    return trimmed
      .split(delimiter)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const validateQuestionConfig = (
    type: QuizQuestion["question_type"],
    options: string[],
    answers: string[]
  ) => {
    if (type === "essay") return null;
    if (!options.length) return "Options are required for this question type.";
    if (!answers.length) return "Correct answer is required for this question type.";
    return null;
  };

  const importBulkQuestions = async (
    quiz: Quiz,
    itemsWithLabels: Array<{
      item: {
        question_text?: string;
        question_type?: QuizQuestion["question_type"] | string;
        options?: string[] | string;
        correct_answer?: string[] | string;
        points?: number | string;
      };
      label: string;
    }>
  ) => {
    if (!itemsWithLabels.length) return;
    const validItems: Array<{
      question_text: string;
      question_type: QuizQuestion["question_type"];
      options?: string[];
      correct_answer?: string[];
      points?: number;
    }> = [];
    const errors: string[] = [];
    const allowedTypes: QuizQuestion["question_type"][] = [
      "multiple_choice",
      "single_choice",
      "true_false",
      "essay",
    ];

    itemsWithLabels.forEach(({ item, label }) => {
      const rawText = item.question_text?.trim();
      if (!rawText) {
        errors.push(`${label}: question_text is required.`);
        return;
      }

      const rawType = item.question_type ?? "multiple_choice";
      const normalizedType = allowedTypes.includes(rawType as QuizQuestion["question_type"])
        ? (rawType as QuizQuestion["question_type"])
        : null;

      if (!normalizedType) {
        errors.push(`${label}: invalid question_type.`);
        return;
      }

      const normalizedPoints = item.points === undefined ? 1 : Number(item.points);
      if (!Number.isFinite(normalizedPoints) || normalizedPoints <= 0) {
        errors.push(`${label}: points must be a positive number.`);
        return;
      }

      const optionsList = Array.isArray(item.options)
        ? item.options
        : typeof item.options === "string"
        ? parseCsvList(item.options)
        : [];
      const answersList = Array.isArray(item.correct_answer)
        ? item.correct_answer
        : typeof item.correct_answer === "string"
        ? parseCsvList(item.correct_answer)
        : [];
      const configMessage = validateQuestionConfig(normalizedType, optionsList, answersList);
      if (configMessage) {
        errors.push(`${label}: ${configMessage}`);
        return;
      }

      validItems.push({
        question_text: rawText,
        question_type: normalizedType,
        points: normalizedPoints,
        options: optionsList.length ? optionsList : undefined,
        correct_answer: answersList.length ? answersList : undefined,
      });
    });

    setBulkErrors((prev) => ({ ...prev, [quiz.id]: errors }));
    if (!validItems.length) return;

    try {
      const created: QuizQuestion[] = [];
      for (const item of validItems) {
        const response = await createQuizQuestion(quiz.id, item);
        created.push(response.data);
      }
      setBulkInput((prev) => ({ ...prev, [quiz.id]: "" }));
      setQuizQuestions((prev) => ({
        ...prev,
        [quiz.id]: [...(prev[quiz.id] ?? []), ...created],
      }));
      setQuestionOrder((prev) => ({
        ...prev,
        [quiz.id]: [...(prev[quiz.id] ?? []), ...created.map((question) => question.id)],
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to import questions");
    }
  };

  const handleBulkImport = async (quiz: Quiz) => {
    const raw = bulkInput[quiz.id];
    if (!raw) return;
    setBulkErrors((prev) => ({ ...prev, [quiz.id]: [] }));

    let itemsWithLabels: Array<{
      item: {
        question_text?: string;
        question_type?: QuizQuestion["question_type"] | string;
        options?: string[] | string;
        correct_answer?: string[] | string;
        points?: number | string;
      };
      label: string;
    }> = [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        itemsWithLabels = parsed.map((item, index) => ({
          item,
          label: `Item ${index + 1}`,
        }));
      } else {
        throw new Error("JSON must be an array");
      }
    } catch {
      const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
      itemsWithLabels = lines.map((line, index) => {
        const [question_text, type, points, options, answers] = line
          .split("|")
          .map((value) => value.trim());
        return {
          item: {
            question_text,
            question_type: type || "multiple_choice",
            points: points ? Number(points) : 1,
            options: options ? parseCsvList(options) : undefined,
            correct_answer: answers ? parseCsvList(answers) : undefined,
          },
          label: `Line ${index + 1}`,
        };
      });
    }

    await importBulkQuestions(quiz, itemsWithLabels);
  };

  const handleBulkFileUpload = async (quiz: Quiz, file: File) => {
    const raw = await file.text();
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (file.name.toLowerCase().endsWith(".json") || trimmed.startsWith("[")) {
      setBulkInput((prev) => ({ ...prev, [quiz.id]: trimmed }));
      await handleBulkImport(quiz);
      return;
    }

    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return;

    const header = lines[0].toLowerCase();
    const dataLines =
      header.includes("question") && header.includes("type") ? lines.slice(1) : lines;

    const itemsWithLabels = dataLines.map((line, index) => {
      const [question_text, type, points, options, answers] = parseCsvLine(line);
      return {
        item: {
          question_text,
          question_type: type || "multiple_choice",
          points: points ? Number(points) : 1,
          options: options ? parseFlexibleList(options) : undefined,
          correct_answer: answers ? parseFlexibleList(answers) : undefined,
        },
        label: `Line ${index + 1}`,
      };
    });

    await importBulkQuestions(quiz, itemsWithLabels);
  };

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
    event: React.DragEvent<HTMLElement>,
    quizId: number,
    questionId: number
  ) => {
    event.dataTransfer.setData("text/plain", `question:${quizId}:${questionId}`);
    setDraggingQuestion({ quizId, questionId });
  };

  const handleQuestionDrop = async (
    event: React.DragEvent<HTMLElement>,
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

  const handleModuleDragStart = (event: React.DragEvent<HTMLElement>, moduleId: number) => {
    event.dataTransfer.setData("text/plain", `module:${moduleId}`);
    setDraggingModuleId(moduleId);
  };

  const handleModuleDrop = async (event: React.DragEvent<HTMLElement>, targetId: number) => {
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
    event: React.DragEvent<HTMLElement>,
    moduleId: number,
    lessonId: number
  ) => {
    event.dataTransfer.setData("text/plain", `lesson:${moduleId}:${lessonId}`);
    setDraggingLesson({ moduleId, lessonId });
  };

  const handleLessonDrop = async (
    event: React.DragEvent<HTMLElement>,
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

  const handleUploadResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !resourceTitle || !resourceFile) return;
    setResourceUploading(true);
    setStatus(null);

    try {
      const response = await uploadResource({
        title: resourceTitle,
        type: resourceType,
        course_id: id,
        lesson_id: resourceLessonId ? Number(resourceLessonId) : undefined,
        is_private: resourcePrivate,
        file: resourceFile,
      });
      setResources((prev) => [response.data, ...prev]);
      setResourceTitle("");
      setResourceType("file");
      setResourceLessonId("");
      setResourceFile(null);
      setResourcePrivate(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to upload resource");
    } finally {
      setResourceUploading(false);
    }
  };

  const handleToggleRosterProgress = async () => {
    if (!id) return;
    const next = !showRosterProgress;
    setShowRosterProgress(next);
    if (!next) return;

    if (!rosterProgress.length) {
      setRosterLoading(true);
      try {
        const response = await getCourseRosterProgress(id);
        setRosterProgress(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load roster progress");
      } finally {
        setRosterLoading(false);
      }
    }
  };

  const filteredRoster = useMemo(() => {
    const query = rosterQuery.trim().toLowerCase();
    const minAverage = rosterMinAverage ? Number(rosterMinAverage) : null;

    return rosterProgress.filter((row) => {
      const name = row.user?.name?.toLowerCase() ?? "";
      const email = row.user?.email?.toLowerCase() ?? "";
      const matchesQuery = query ? name.includes(query) || email.includes(query) : true;
      const matchesAverage =
        minAverage === null || Number.isNaN(minAverage)
          ? true
          : row.average_progress >= minAverage;
      return matchesQuery && matchesAverage;
    });
  }, [rosterProgress, rosterQuery, rosterMinAverage]);

  const downloadRosterCsv = () => {
    if (!filteredRoster.length) return;
    const headers = [
      "student_id",
      "student_name",
      "student_email",
      "total_lessons",
      "completed_lessons",
      "average_progress",
    ];
    const rows = filteredRoster.map((row) => [
      row.user_id,
      row.user?.name ?? "",
      row.user?.email ?? "",
      row.total,
      row.completed,
      row.average_progress,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return text.includes(",") || text.includes("\n") || text.includes('"')
              ? `"${text.replace(/"/g, '""')}"`
              : text;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `course-${id}-roster-progress.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RequireRole roles={["instructor", "admin"]}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeader
          eyebrow="Instructor"
          title={course?.title ?? "Course"}
          description="Manage modules and lessons."
          action={
            id ? (
              <Link className="text-xs text-amber-300" href={`/instructor/courses/${id}/preview`}>
                Preview course
              </Link>
            ) : null
          }
        />

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <Panel>
          <form onSubmit={handleCreateModule}>
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
            <Button type="submit" variant="primary" className="mt-4 px-5 py-2 text-sm">
              Add module
            </Button>
          </form>
        </Panel>

        <section className="space-y-4">
          {orderedModules.map((module) => (
            <Panel
              key={module.id}
              className={`transition ${
                dragOverModuleId === module.id ? "ring-2 ring-amber-300/40" : ""
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
                  <Button
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() => void handleUpdateModule(module)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() => void handleMoveModule(module.id, "up")}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() => void handleMoveModule(module.id, "down")}
                  >
                    Move down
                  </Button>
                  <Button
                    type="button"
                    className="px-4 py-2 text-xs border-rose-500/40 text-rose-200"
                    onClick={() => void handleDeleteModule(module)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-slate-400">
                <label className="grid gap-2">
                  Takeaways
                  <textarea
                    className="min-h-[72px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                    value={
                      moduleTakeaways[module.id] ??
                      (module.takeaways?.length ? module.takeaways.join("; ") : "")
                    }
                    onChange={(event) =>
                      setModuleTakeaways((prev) => ({
                        ...prev,
                        [module.id]: event.target.value,
                      }))
                    }
                    placeholder="Outcome 1; Outcome 2; Outcome 3"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  Separate items with commas or semicolons. Leave blank to clear.
                </p>
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
                  <Button
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() => void handleCreateLesson(module)}
                  >
                    Add lesson
                  </Button>
                </div>

                <div className="space-y-2">
                  {getOrderedLessons(module).map((lesson) => (
                    <div key={lesson.id} className="space-y-3">
                      <Card
                        className={`flex flex-wrap items-center justify-between gap-3 p-3 transition ${
                          dragOverLesson?.lessonId === lesson.id &&
                          dragOverLesson?.moduleId === module.id
                            ? "ring-2 ring-amber-300/30"
                            : ""
                        } ${
                          draggingLesson?.lessonId === lesson.id &&
                          draggingLesson?.moduleId === module.id
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
                          <Badge>{lesson.is_published ? "Published" : "Draft"}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <input
                            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                            value={editingLesson[lesson.id] ?? ""}
                            onChange={(event) =>
                              setEditingLesson((prev) => ({
                                ...prev,
                                [lesson.id]: event.target.value,
                              }))
                            }
                            placeholder="Rename lesson"
                          />
                          <Button
                            type="button"
                            className="px-4 py-2 text-xs"
                            onClick={() => void handleUpdateLesson(lesson)}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            className="px-4 py-2 text-xs"
                            onClick={() => void handleMoveLesson(module, lesson.id, "up")}
                          >
                            Move up
                          </Button>
                          <Button
                            type="button"
                            className="px-4 py-2 text-xs"
                            onClick={() => void handleMoveLesson(module, lesson.id, "down")}
                          >
                            Move down
                          </Button>
                          <Button
                            type="button"
                            className="px-4 py-2 text-xs border-rose-500/40 text-rose-200"
                            onClick={() => void handleDeleteLesson(lesson)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Card>
                      <div className="grid gap-3">
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
                            setLessonContent((prev) => ({
                              ...prev,
                              [lesson.id]: event.target.value,
                            }))
                          }
                          placeholder="Lesson content"
                        />
                        <div>
                          <Button
                            type="button"
                            className="px-4 py-2 text-xs"
                            onClick={() => void handleUpdateLessonContent(lesson)}
                          >
                            Save content
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!module.lessons?.length && (
                    <p className="text-sm text-slate-400">No lessons yet.</p>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel>
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
              <Button type="submit" variant="primary" className="px-5 py-2 text-xs">
                Create assignment
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              {(course?.assignments ?? []).map((assignment) => (
                <div key={assignment.id} className="space-y-3">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold">{assignment.title}</p>
                      <Badge>{assignment.is_published ? "Published" : "Draft"}</Badge>
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
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void handleUpdateAssignment(assignment)}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void handleToggleAssignmentPublish(assignment)}
                      >
                        Toggle publish
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void toggleAssignmentSubmissions(assignment)}
                      >
                        Submissions
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs border-rose-500/40 text-rose-200"
                        onClick={() => void handleDeleteAssignment(assignment)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                  {expandedAssignment[assignment.id] ? (
                    <Card className="p-4">
                      <h3 className="text-sm font-semibold">Submissions</h3>
                      <div className="mt-3 space-y-3">
                        {(assignmentSubmissions[assignment.id] ?? []).map((submission) => (
                          <Card
                            key={submission.id}
                            className="flex flex-wrap items-center justify-between gap-3 p-3"
                          >
                            <div>
                              <p className="text-sm font-semibold">{submission.user?.name ?? "Student"}</p>
                              <p className="text-xs text-slate-500">Submitted {submission.submitted_at}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                                type="number"
                                min={0}
                                value={gradingScore[submission.id] ?? submission.score ?? ""}
                                onChange={(event) =>
                                  setGradingScore((prev) => ({
                                    ...prev,
                                    [submission.id]: Number(event.target.value),
                                  }))
                                }
                                placeholder="Score"
                              />
                              <Button
                                type="button"
                                className="px-3 py-1 text-xs"
                                onClick={() =>
                                  void handleGradeSubmission(assignment.id, submission.id)
                                }
                              >
                                Grade
                              </Button>
                              {submission.file_path ? (
                                <a
                                  className="text-xs text-amber-300"
                                  href={submissionDownloadUrl(submission.id)}
                                >
                                  Download
                                </a>
                              ) : null}
                            </div>
                          </Card>
                        ))}
                        {!(assignmentSubmissions[assignment.id] ?? []).length && (
                          <p className="text-sm text-slate-400">No submissions yet.</p>
                        )}
                      </div>
                    </Card>
                  ) : null}
                </div>
              ))}
              {!(course?.assignments ?? []).length && (
                <p className="text-sm text-slate-400">No assignments yet.</p>
              )}
            </div>
          </Panel>

          <Panel>
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
              <Button type="submit" variant="primary" className="px-5 py-2 text-xs">
                Create quiz
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              {(course?.quizzes ?? []).map((quiz) => (
                <div key={quiz.id} className="space-y-3">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold">{quiz.title}</p>
                      <Badge>{quiz.is_published ? "Published" : "Draft"}</Badge>
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
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void handleUpdateQuiz(quiz)}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void handleToggleQuizPublish(quiz)}
                      >
                        Toggle publish
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void toggleQuizQuestions(quiz)}
                      >
                        Questions
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => void toggleQuizAttempts(quiz)}
                      >
                        Attempts
                      </Button>
                      <Button
                        type="button"
                        className="px-4 py-2 text-xs border-rose-500/40 text-rose-200"
                        onClick={() => void handleDeleteQuiz(quiz)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                  {expandedQuizAttempts[quiz.id] ? (
                    <Card className="p-4">
                      <h3 className="text-sm font-semibold">Recent attempts</h3>
                      <div className="mt-3 space-y-3">
                        {(quizAttempts[quiz.id] ?? []).map((attempt) => (
                          <Card
                            key={attempt.id}
                            className="flex flex-wrap items-center justify-between gap-3 p-3"
                          >
                            <div>
                              <p className="text-sm font-semibold">{attempt.user?.name ?? "Student"}</p>
                              <p className="text-xs text-slate-500">Completed {attempt.completed_at}</p>
                            </div>
                            <p className="text-xs text-slate-300">Score {attempt.score ?? "-"}</p>
                          </Card>
                        ))}
                        {!(quizAttempts[quiz.id] ?? []).length && (
                          <p className="text-sm text-slate-400">No attempts yet.</p>
                        )}
                      </div>
                    </Card>
                  ) : null}
                  {expandedQuiz[quiz.id] ? (
                  <Card className="mt-4 p-4">
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
                          }
                          type="number"
                          min={1}
                        />
                        <Button
                          type="button"
                          variant="primary"
                          className="px-4 py-2 text-xs"
                          onClick={() => void handleCreateQuestion(quiz)}
                        >
                          Add question
                        </Button>
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
                      {(() => {
                        const type = questionType[quiz.id] ?? "multiple_choice";
                        const options = parseCsvList(questionOptions[quiz.id] ?? "");
                        const answers = parseCsvList(questionAnswer[quiz.id] ?? "");
                        const message = validateQuestionConfig(type, options, answers);
                        return message ? (
                          <p className="text-xs text-amber-300">{message}</p>
                        ) : null;
                      })()}
                      <div className="flex flex-wrap items-center gap-2">
                        <textarea
                          className="min-h-[80px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                          value={bulkInput[quiz.id] ?? ""}
                          onChange={(event) =>
                            setBulkInput((prev) => ({ ...prev, [quiz.id]: event.target.value }))
                          }
                          placeholder={
                            "Bulk import: JSON array or lines like\nQuestion?|multiple_choice|1|A,B,C|A"
                          }
                        />
                        <Button
                          type="button"
                          className="px-4 py-2 text-xs"
                          onClick={() => void handleBulkImport(quiz)}
                        >
                          Import
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <label className="flex items-center gap-2">
                          <span>Upload CSV/JSON</span>
                          <input
                            className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs"
                            type="file"
                            accept=".csv,.json,.txt"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void handleBulkFileUpload(quiz, file);
                              }
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <span>CSV columns: question_text, question_type, points, options, correct_answer</span>
                        <span>Use semicolons in options/answers to avoid CSV commas.</span>
                      </div>
                      {bulkErrors[quiz.id]?.length ? (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
                          <p className="font-semibold">Import errors</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {bulkErrors[quiz.id].map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2">
                      {orderedQuestions(quiz.id).map((question) => (
                        <Card
                          key={question.id}
                          className={`flex flex-wrap items-center justify-between gap-3 p-3 ${
                            dragOverQuestion?.quizId === quiz.id &&
                            dragOverQuestion?.questionId === question.id
                              ? "ring-2 ring-amber-300/30"
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
                              {(() => {
                                const type =
                                  editingQuestionType[question.id] ?? question.question_type;
                                const optionsValue =
                                  editingQuestionOptions[question.id] ??
                                  (question.options ? question.options.join(", ") : "");
                                const answersValue =
                                  editingQuestionAnswer[question.id] ??
                                  (question.correct_answer ? question.correct_answer.join(", ") : "");
                                const message = validateQuestionConfig(
                                  type,
                                  parseCsvList(optionsValue),
                                  parseCsvList(answersValue)
                                );
                                return message ? (
                                  <p className="md:col-span-2 text-xs text-amber-300">{message}</p>
                                ) : null;
                              })()}
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
                            <Button
                              type="button"
                              className="px-4 py-2 text-xs"
                              onClick={() => void handleUpdateQuestion(quiz.id, question)}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              className="px-4 py-2 text-xs border-rose-500/40 text-rose-200"
                              onClick={() => void handleDeleteQuestion(quiz.id, question)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {!orderedQuestions(quiz.id).length && (
                        <p className="text-sm text-slate-400">No questions yet.</p>
                      )}
                    </div>
                  </Card>
                  ) : null}
                </div>
              ))}
              {!(course?.quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No quizzes yet.</p>
              )}
            </div>
          </Panel>
        </section>

        <Panel>
          <h2 className="text-lg font-semibold">Resources</h2>
          <form className="mt-4 grid gap-3" onSubmit={handleUploadResource}>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={resourceTitle}
                onChange={(event) => setResourceTitle(event.target.value)}
                placeholder="Resource title"
                required
              />
              <select
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
              >
                <option value="file">File</option>
                <option value="slides">Slides</option>
                <option value="worksheet">Worksheet</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={resourceLessonId}
                onChange={(event) => setResourceLessonId(event.target.value)}
              >
                <option value="">Course-level resource</option>
                {course?.modules?.flatMap((module) =>
                  module.lessons?.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {module.title} · {lesson.title}
                    </option>
                  )) ?? []
                )}
              </select>
              <input
                className="text-sm"
                type="file"
                onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={resourcePrivate}
                onChange={(event) => setResourcePrivate(event.target.checked)}
              />
              Private to enrolled learners
            </label>
            <Button type="submit" className="px-4 py-2 text-xs" disabled={resourceUploading}>
              {resourceUploading ? "Uploading..." : "Upload resource"}
            </Button>
          </form>

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

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Roster progress</h2>
            <Button
              type="button"
              className="px-4 py-2 text-xs"
              onClick={() => void handleToggleRosterProgress()}
            >
              {showRosterProgress ? "Hide" : "Load"}
            </Button>
          </div>
          {showRosterProgress ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-xs text-slate-400">
                  Search
                  <input
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                    value={rosterQuery}
                    onChange={(event) => setRosterQuery(event.target.value)}
                    placeholder="Name or email"
                  />
                </label>
                <label className="grid gap-1 text-xs text-slate-400">
                  Min avg %
                  <input
                    className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                    value={rosterMinAverage}
                    onChange={(event) => setRosterMinAverage(event.target.value)}
                    type="number"
                    min={0}
                    max={100}
                  />
                </label>
                <Button type="button" className="px-4 py-2 text-xs" onClick={downloadRosterCsv}>
                  Download CSV
                </Button>
              </div>
              {rosterLoading ? <p className="text-sm text-slate-400">Loading roster...</p> : null}
              {!rosterLoading && !filteredRoster.length ? (
                <p className="text-sm text-slate-400">No progress data yet.</p>
              ) : null}
              {filteredRoster.map((row) => (
                <Card key={row.user_id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-semibold">{row.user?.name ?? "Student"}</p>
                    <p className="text-xs text-slate-500">{row.user?.email ?? ""}</p>
                  </div>
                  <div className="text-xs text-slate-400">
                    {row.completed}/{row.total} lessons · Avg {row.average_progress}%
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </Panel>
      </main>
    </RequireRole>
  );
}

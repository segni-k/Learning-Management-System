import { apiJson } from "./api";
import type {
  ApiResponse,
  CourseProgressSummary,
  ResumeLesson,
  StudentActivity,
  StudentCourseDashboard,
  StudentCoursework,
  StudentDashboardOverview,
  StudentNotificationSummary,
  StudentNotifications,
} from "./types";

export async function getStudentOverview() {
  return apiJson<ApiResponse<StudentDashboardOverview>>("/api/v1/student/dashboard/overview");
}

export async function listStudentNotifications() {
  return apiJson<ApiResponse<StudentNotifications>>("/api/v1/student/notifications");
}

export async function getStudentNotificationSummary() {
  return apiJson<ApiResponse<StudentNotificationSummary>>("/api/v1/student/notifications/summary");
}

export async function markStudentNotificationsRead(
  notifications: Array<{ type: string; id: number }>
) {
  return apiJson<{ message: string }>("/api/v1/student/notifications/read", {
    method: "POST",
    body: JSON.stringify({ notifications }),
  });
}

export async function listStudentCoursework(params?: {
  course_id?: number;
  assignments_page?: number;
  assignments_per_page?: number;
  assignments_status?: string;
  due_from?: string;
  due_to?: string;
  quizzes_page?: number;
  quizzes_per_page?: number;
  quiz_status?: string;
}) {
  const search = new URLSearchParams();
  const entries = Object.entries(params ?? {}) as Array<[
    string,
    string | number | undefined | null
  ]>;
  entries.forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return apiJson<{ data: StudentCoursework; meta: unknown }>(
    `/api/v1/student/coursework${query ? `?${query}` : ""}`
  );
}

export async function listStudentActivity(params?: {
  course_id?: number;
  submissions_page?: number;
  submissions_per_page?: number;
  attempts_page?: number;
  attempts_per_page?: number;
}) {
  const search = new URLSearchParams();
  const entries = Object.entries(params ?? {}) as Array<[
    string,
    string | number | undefined | null
  ]>;
  entries.forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return apiJson<{ data: StudentActivity; meta: unknown }>(
    `/api/v1/student/activity${query ? `?${query}` : ""}`
  );
}

export async function getStudentCourseDashboard(courseId: number, params?: {
  assignments_limit?: number;
  quizzes_limit?: number;
  modules_page?: number;
  modules_per_page?: number;
}) {
  const search = new URLSearchParams();
  const entries = Object.entries(params ?? {}) as Array<[
    string,
    string | number | undefined | null
  ]>;
  entries.forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return apiJson<{ data: StudentCourseDashboard; meta: unknown }>(
    `/api/v1/student/courses/${courseId}/dashboard${query ? `?${query}` : ""}`
  );
}

export async function getResumeLesson(courseId?: number) {
  const query = courseId ? `?course_id=${courseId}` : "";
  return apiJson<ApiResponse<ResumeLesson>>(`/api/v1/student/resume-lesson${query}`);
}

export async function getCourseProgress(courseId: number) {
  return apiJson<ApiResponse<CourseProgressSummary>>(`/api/v1/courses/${courseId}/progress`);
}

export async function upsertLessonProgress(payload: {
  lesson_id: number;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
}) {
  return apiJson<ApiResponse<CourseProgressSummary | unknown>>("/api/v1/progress", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

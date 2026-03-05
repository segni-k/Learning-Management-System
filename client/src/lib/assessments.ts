import { apiJson } from "./api";
import type { ApiResponse, Assignment, Quiz } from "./types";

export async function createAssignment(courseId: number, payload: Partial<Assignment>) {
  return apiJson<ApiResponse<Assignment>>(`/api/v1/courses/${courseId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAssignment(id: number, payload: Partial<Assignment>) {
  return apiJson<ApiResponse<Assignment>>(`/api/v1/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAssignment(id: number) {
  return apiJson<{ message: string }>(`/api/v1/assignments/${id}`, {
    method: "DELETE",
  });
}

export async function createQuiz(courseId: number, payload: Partial<Quiz>) {
  return apiJson<ApiResponse<Quiz>>(`/api/v1/courses/${courseId}/quizzes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuiz(id: number, payload: Partial<Quiz>) {
  return apiJson<ApiResponse<Quiz>>(`/api/v1/quizzes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuiz(id: number) {
  return apiJson<{ message: string }>(`/api/v1/quizzes/${id}`, {
    method: "DELETE",
  });
}

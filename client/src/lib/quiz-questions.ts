import { apiJson } from "./api";
import type { ApiResponse, QuizQuestion } from "./types";

export async function listQuizQuestions(quizId: number) {
  return apiJson<ApiResponse<QuizQuestion[]>>(`/api/v1/quizzes/${quizId}/questions`);
}

export async function createQuizQuestion(quizId: number, payload: Partial<QuizQuestion>) {
  return apiJson<ApiResponse<QuizQuestion>>(`/api/v1/quizzes/${quizId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuizQuestion(id: number, payload: Partial<QuizQuestion>) {
  return apiJson<ApiResponse<QuizQuestion>>(`/api/v1/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuizQuestion(id: number) {
  return apiJson<{ message: string }>(`/api/v1/questions/${id}`, {
    method: "DELETE",
  });
}

export async function reorderQuizQuestions(quizId: number, orderedIds: number[]) {
  return apiJson<{ message: string }>(`/api/v1/quizzes/${quizId}/questions/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

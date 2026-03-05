import { apiJson } from "./api";
import type { ApiResponse, QuizAttempt } from "./types";

export async function listQuizAttempts(quizId: number) {
  return apiJson<ApiResponse<QuizAttempt[]>>(`/api/v1/quizzes/${quizId}/attempts`);
}

export async function createQuizAttempt(
  quizId: number,
  payload: { answers: Array<{ question_id: number; answer?: string | string[] | null }> }
) {
  return apiJson<ApiResponse<QuizAttempt>>(`/api/v1/quizzes/${quizId}/attempts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

import { apiFetch, apiJson, API_BASE_URL } from "./api";
import type { ApiResponse, AssignmentSubmission } from "./types";

export async function listAssignmentSubmissions(assignmentId: number) {
  return apiJson<ApiResponse<AssignmentSubmission[]>>(
    `/api/v1/assignments/${assignmentId}/submissions`
  );
}

export async function createAssignmentSubmission(
  assignmentId: number,
  payload: { content?: string; file?: File }
) {
  const form = new FormData();
  if (payload.content) form.append("content", payload.content);
  if (payload.file) form.append("file", payload.file);

  const response = await apiFetch(`/api/v1/assignments/${assignmentId}/submissions`, {
    method: "POST",
    body: form,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message ?? "Request failed";
    throw new Error(message);
  }
  return data as ApiResponse<AssignmentSubmission>;
}

export async function updateAssignmentSubmission(
  submissionId: number,
  payload: { score?: number; feedback?: string }
) {
  return apiJson<ApiResponse<AssignmentSubmission>>(`/api/v1/submissions/${submissionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function submissionDownloadUrl(submissionId: number) {
  return `${API_BASE_URL}/api/v1/submissions/${submissionId}/download`;
}

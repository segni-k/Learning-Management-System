import { apiFetch, apiJson, API_BASE_URL } from "./api";
import type { ApiResponse, Resource } from "./types";

export async function listResources(params?: { course_id?: number; lesson_id?: number }) {
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
  return apiJson<ApiResponse<Resource[]>>(`/api/v1/resources${query ? `?${query}` : ""}`);
}

export async function uploadResource(payload: {
  title: string;
  type: string;
  course_id?: number;
  lesson_id?: number;
  is_private?: boolean;
  file: File;
}) {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("type", payload.type);
  if (payload.course_id) form.append("course_id", String(payload.course_id));
  if (payload.lesson_id) form.append("lesson_id", String(payload.lesson_id));
  if (payload.is_private !== undefined) {
    form.append("is_private", payload.is_private ? "1" : "0");
  }
  form.append("file", payload.file);

  const response = await apiFetch("/api/v1/resources", {
    method: "POST",
    body: form,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message ?? "Request failed";
    throw new Error(message);
  }
  return data as { data: Resource; url?: string };
}

export function resourceDownloadUrl(resourceId: number) {
  return `${API_BASE_URL}/api/v1/resources/${resourceId}/download`;
}

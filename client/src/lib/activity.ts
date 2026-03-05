import { apiJson } from "./api";
import type { StudentActivity } from "./types";

export async function listInstructorActivity(params?: {
  course_id?: number;
  submissions_page?: number;
  submissions_per_page?: number;
  attempts_page?: number;
  attempts_per_page?: number;
}) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return apiJson<{ data: StudentActivity; meta: unknown }>(
    `/api/v1/instructor/activity${query ? `?${query}` : ""}`
  );
}

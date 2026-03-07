import { apiJson } from "./api";
import type { ApiResponse, CourseRosterProgressRow } from "./types";

export async function getCourseRosterProgress(courseId: number) {
  return apiJson<ApiResponse<CourseRosterProgressRow[]>>(
    `/api/v1/courses/${courseId}/progress/roster`
  );
}

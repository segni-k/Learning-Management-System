import { apiJson } from "./api";
import type { ApiResponse, Enrollment } from "./types";

export async function listEnrollments() {
  return apiJson<ApiResponse<Enrollment[]>>("/api/v1/enrollments");
}

export async function enrollInCourse(courseId: number) {
  return apiJson<ApiResponse<Enrollment>>(`/api/v1/courses/${courseId}/enroll`, {
    method: "POST",
  });
}

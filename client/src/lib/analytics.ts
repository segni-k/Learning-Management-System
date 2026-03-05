import { apiJson } from "./api";
import type { AnalyticsCourseRow, AnalyticsOverview, ApiResponse } from "./types";

export async function getInstructorAnalyticsOverview() {
  return apiJson<ApiResponse<AnalyticsOverview>>("/api/v1/instructor/analytics/overview");
}

export async function getInstructorAnalyticsCourses() {
  return apiJson<ApiResponse<AnalyticsCourseRow[]>>("/api/v1/instructor/analytics/courses");
}

export async function getAdminAnalyticsOverview() {
  return apiJson<ApiResponse<AnalyticsOverview>>("/api/v1/admin/analytics/overview");
}

export async function getAdminAnalyticsCourses() {
  return apiJson<ApiResponse<AnalyticsCourseRow[]>>("/api/v1/admin/analytics/courses");
}

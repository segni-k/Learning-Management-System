import { API_BASE_URL } from "./api";

export function adminEnrollmentsExportUrl(params?: {
  course_id?: number;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return `${API_BASE_URL}/api/v1/admin/exports/enrollments${query ? `?${query}` : ""}`;
}

export function adminProgressExportUrl(params?: { course_id?: number }) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return `${API_BASE_URL}/api/v1/admin/exports/progress${query ? `?${query}` : ""}`;
}

export function instructorSubmissionsExportUrl(params?: {
  course_id?: number;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return `${API_BASE_URL}/api/v1/instructor/exports/submissions${query ? `?${query}` : ""}`;
}

export function instructorAttemptsExportUrl(params?: {
  course_id?: number;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return `${API_BASE_URL}/api/v1/instructor/exports/attempts${query ? `?${query}` : ""}`;
}

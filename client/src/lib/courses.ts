import { apiJson } from "./api";
import type { ApiResponse, Course, Lesson, Module } from "./types";

export async function listCourses() {
  return apiJson<ApiResponse<Course[]>>("/api/v1/courses");
}

export async function getCourse(id: number) {
  return apiJson<ApiResponse<Course>>(`/api/v1/courses/${id}`);
}

export async function createCourse(payload: Partial<Course>) {
  return apiJson<ApiResponse<Course>>("/api/v1/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCourse(id: number, payload: Partial<Course>) {
  return apiJson<ApiResponse<Course>>(`/api/v1/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCourse(id: number) {
  return apiJson<{ message: string }>(`/api/v1/courses/${id}`, {
    method: "DELETE",
  });
}

export async function createModule(courseId: number, payload: Partial<Module>) {
  return apiJson<ApiResponse<Module>>(`/api/v1/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateModule(id: number, payload: Partial<Module>) {
  return apiJson<ApiResponse<Module>>(`/api/v1/modules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteModule(id: number) {
  return apiJson<{ message: string }>(`/api/v1/modules/${id}`, {
    method: "DELETE",
  });
}

export async function reorderModules(moduleId: number, orderedIds: number[]) {
  return apiJson<{ message: string }>(`/api/v1/modules/${moduleId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export async function createLesson(moduleId: number, payload: Partial<Lesson>) {
  return apiJson<ApiResponse<Lesson>>(`/api/v1/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLesson(id: number, payload: Partial<Lesson>) {
  return apiJson<ApiResponse<Lesson>>(`/api/v1/lessons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteLesson(id: number) {
  return apiJson<{ message: string }>(`/api/v1/lessons/${id}`, {
    method: "DELETE",
  });
}

export async function reorderLessons(moduleId: number, orderedIds: number[]) {
  return apiJson<{ message: string }>(`/api/v1/modules/${moduleId}/lessons/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

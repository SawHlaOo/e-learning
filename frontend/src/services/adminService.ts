import { api, apiData } from "./api";
import type { Course, Lesson, Module } from "../types";

export type CourseAdminSummary = Pick<Course, "id" | "title" | "slug" | "level" | "published" | "telegramEnrollmentEnabled" | "_count"> & {
  createdAt: string;
};
export type ManagedLesson = Omit<Lesson, "order" | "published"> & { order: number; published: boolean };
export type ManagedModule = Omit<Module, "order" | "lessons"> & { order: number; lessons: ManagedLesson[] };
export type ManagedCourse = Omit<Course, "modules"> & { modules: ManagedModule[] };

export interface Analytics {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  totalLessons: number;
  totalExercises: number;
  totalVideos: number;
  totalCertificates: number;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  _count: { enrollments: number; lessonProgress: number };
}

export interface AdminStudentPage {
  items: AdminStudent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const adminService = {
  analytics: () => apiData<Analytics>(api.get("/admin/analytics")),
  students: async (page = 1, limit = 20): Promise<AdminStudentPage> => {
    const response = await api.get<{
      data: AdminStudent[];
      pagination: AdminStudentPage["pagination"];
    }>("/admin/students", { params: { page, limit } });
    return { items: response.data.data, pagination: response.data.pagination };
  },
  courses: () => apiData<CourseAdminSummary[]>(api.get("/admin/courses?limit=100")),
  courseForEditing: (id: string) => apiData<ManagedCourse>(api.get(`/admin/courses/${id}`)),
  setStudentStatus: (id: string, isActive: boolean) =>
    apiData<{ id: string; isActive: boolean }>(api.patch(`/admin/students/${id}/status`, { isActive })),
};

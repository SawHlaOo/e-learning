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

export interface AdminQuizQuestion {
  id: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "CODE"; prompt: string;
  options: unknown[]; correctAnswer?: unknown; acceptedAnswers?: unknown[] | null; explanation?: string | null; hint?: string | null;
  points: number; order: number; isActive: boolean; difficulty: "EASY" | "MEDIUM" | "HARD"; codeSnippet?: string | null; mediaUrl?: string | null;
}
export interface AdminQuiz { id: string; title: string; description: string; instructions: string; difficulty: "EASY" | "MEDIUM" | "HARD"; passingPercentage: number; timeLimitMinutes: number; published: boolean; isActive: boolean; lessonId?: string | null; questions: AdminQuizQuestion[]; _count?: { questions: number; attempts: number }; lesson?: { id: string; title: string } | null; }

export type QuizAdminInput = Omit<AdminQuiz, "id" | "questions" | "_count" | "lesson"> & { lessonId?: string | null; randomizeQuestions?: boolean; randomizeAnswers?: boolean };
export type QuizQuestionAdminInput = Omit<AdminQuizQuestion, "id">;

export const adminService = {
  analytics: () => apiData<Analytics>(api.get("/admin/analytics")),
  students: () => apiData<AdminStudent[]>(api.get("/admin/students")),
  courses: () => apiData<CourseAdminSummary[]>(api.get("/admin/courses?limit=100")),
  courseForEditing: (id: string) => apiData<ManagedCourse>(api.get(`/admin/courses/${id}`)),
  setStudentStatus: (id: string, isActive: boolean) =>
    apiData<{ id: string; isActive: boolean }>(api.patch(`/admin/students/${id}/status`, { isActive })),
  quizzes: () => apiData<AdminQuiz[]>(api.get("/admin/quizzes")),
  quiz: (id: string) => apiData<AdminQuiz>(api.get(`/admin/quizzes/${id}`)),
  createQuiz: (input: Partial<QuizAdminInput>) => apiData<AdminQuiz>(api.post("/admin/quizzes", input)),
  updateQuiz: (id: string, input: Partial<QuizAdminInput>) => apiData<AdminQuiz>(api.put(`/admin/quizzes/${id}`, input)),
  deleteQuiz: (id: string) => apiData<{ id: string }>(api.delete(`/admin/quizzes/${id}`)),
  createQuizQuestion: (quizId: string, input: QuizQuestionAdminInput) => apiData<AdminQuizQuestion>(api.post(`/admin/quizzes/${quizId}/questions`, input)),
  updateQuizQuestion: (id: string, input: Partial<QuizQuestionAdminInput>) => apiData<AdminQuizQuestion>(api.put(`/admin/quiz-questions/${id}`, input)),
  deleteQuizQuestion: (id: string) => apiData<{ id: string }>(api.delete(`/admin/quiz-questions/${id}`)),
};

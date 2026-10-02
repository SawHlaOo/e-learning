export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  level: "EASY" | "MEDIUM" | "HARD";
  thumbnail?: string | null;
  featured?: boolean;
  published?: boolean;
  telegramEnrollmentEnabled?: boolean;
  estimatedHours?: number;
  _count?: { modules: number; enrollments: number };
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  order?: number;
  courseId?: string;
  description?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  published?: boolean;
  order?: number;
  durationMinutes?: number;
  youtubeUrl?: string | null;
  moduleId?: string;
}

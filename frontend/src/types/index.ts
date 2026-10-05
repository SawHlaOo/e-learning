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

export type QuizQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "CODE";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: Array<string | number | boolean> | Record<string, unknown> | unknown[];
  explanation?: string | null;
  hint?: string | null;
  points?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  codeSnippet?: string | null;
  mediaUrl?: string | null;
  order?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  passingPercentage?: number;
  timeLimitMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  published?: boolean;
  questions?: QuizQuestion[];
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
  module?: { title: string; courseId: string };
  quizzes?: Quiz[];
}

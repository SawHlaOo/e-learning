import { api, apiData } from "./api";
import type { LearningResource, Lesson } from "../types";

export const lessonService = {
  get: (id: string) => apiData<Lesson & { module: { title: string; courseId: string }; exercises: unknown[]; resources: LearningResource[] }>(api.get(`/lessons/${id}`)),
  create: (input: LessonInput) => apiData<Lesson>(api.post("/lessons", input)),
  update: (id: string, input: Partial<LessonInput>) => apiData<Lesson>(api.put(`/lessons/${id}`, input)),
  delete: (id: string) => apiData<{ id: string }>(api.delete(`/lessons/${id}`)),
};

export interface LessonInput {
  title: string;
  slug: string;
  content: string;
  order: number;
  published: boolean;
  durationMinutes: number;
  youtubeUrl?: string | null;
  moduleId: string;
}

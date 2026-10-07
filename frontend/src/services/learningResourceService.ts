import { api, apiData } from "./api";
import type { LearningResource, LearningResourceType } from "../types";

export interface LearningResourcePage {
  items: LearningResource[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface LearningResourceInput {
  title: string;
  description: string;
  url: string;
  type: LearningResourceType;
  thumbnail?: string | null;
  order: number;
  isPublished: boolean;
  lessonId: string;
}

export interface LearningResourceFilters {
  search?: string;
  type?: LearningResourceType;
  courseId?: string;
  lessonId?: string;
  page?: number;
  limit?: number;
}

export const learningResourceService = {
  listPage: async (filters: LearningResourceFilters = {}) => {
    const response = await api.get<{ data: LearningResource[]; pagination: LearningResourcePage["pagination"] }>("/admin/learning-resources", {
      params: { limit: 100, ...filters },
    });
    return { items: response.data.data, pagination: response.data.pagination };
  },
  list: async (filters: LearningResourceFilters = {}) =>
    (await learningResourceService.listPage(filters)).items,
  get: (id: string) =>
    apiData<LearningResource>(api.get(`/admin/learning-resources/${id}`)),
  create: (input: LearningResourceInput) =>
    apiData<LearningResource>(api.post("/admin/learning-resources", input)),
  update: (id: string, input: Partial<LearningResourceInput>) =>
    apiData<LearningResource>(api.put(`/admin/learning-resources/${id}`, input)),
  delete: (id: string) =>
    apiData<{ id: string }>(api.delete(`/admin/learning-resources/${id}`)),
};

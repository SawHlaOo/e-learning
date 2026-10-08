import { api, apiData } from "./api";
import type { Course } from "../types";

export const courseService = {
  list: async () => {
    const result = await apiData<unknown>(api.get("/courses"));
    if (!Array.isArray(result)) {
      throw new Error("The courses API returned an invalid response.");
    }
    return result as Course[];
  },
  listPage: async (page: number, limit = 20) => {
    const response = await api.get<{
      data: Course[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>("/courses", { params: { page, limit } });
    return { items: response.data.data, pagination: response.data.pagination };
  },
  get: (id: string) => apiData<Course>(api.get(`/courses/${id}`)),
  create: (input: CourseInput) => apiData<Course>(api.post("/courses", input)),
  update: (id: string, input: Partial<CourseInput>) => apiData<Course>(api.put(`/courses/${id}`, input)),
  delete: (id: string) => apiData<{ id: string }>(api.delete(`/courses/${id}`)),
};

export interface CourseInput {
  title: string;
  slug: string;
  description: string;
  summary: string;
  thumbnail: string;
  level: Course["level"];
  estimatedHours: number;
  published: boolean;
  featured: boolean;
  telegramEnrollmentEnabled: boolean;
}

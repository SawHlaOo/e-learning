import { api, apiData } from "./api";

export const progressService = {
  get: () => apiData<{ enrollments: unknown[]; lessonProgress: unknown[] }>(api.get("/progress")),
};

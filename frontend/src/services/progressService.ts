import { api, apiData } from "./api";

export const progressService = {
  get: () => apiData<{ enrollments: unknown[]; lessonProgress: unknown[]; quizAttempts: Array<{ score: number; passed: boolean }>; quizSummary: Array<{ bestScore: number }> }>(api.get("/progress")),
};

import { api, apiData } from "./api";
import type { Quiz } from "../types";

export const quizService = {
  list: () => apiData<unknown[]>(api.get("/quizzes")),
  get: (id: string) => apiData<Quiz>(api.get(`/quizzes/${id}`)),
  submit: (quizId: string, answers: Record<string, unknown>) => apiData<{
    id: string;
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  }>(api.post(`/quizzes/${quizId}/attempts`, { answers })),
};

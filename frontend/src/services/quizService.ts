import { api, apiData } from "./api";

export const quizService = {
  list: () => apiData<unknown[]>(api.get("/quizzes")),
};

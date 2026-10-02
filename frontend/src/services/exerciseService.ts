import { api, apiData } from "./api";

export const exerciseService = {
  list: () => apiData<unknown[]>(api.get("/exercises")),
  submit: (id: string, code: string) => apiData<{ id: string; isPassed: boolean; feedback: string }>(api.post(`/exercises/${id}/submit`, { code })),
};

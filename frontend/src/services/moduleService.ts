import { api, apiData } from "./api";
import type { Module } from "../types";

export interface ModuleInput {
  title: string;
  description: string;
  order: number;
  courseId: string;
}

export const moduleService = {
  create: (input: ModuleInput) => apiData<Module>(api.post("/modules", input)),
  update: (id: string, input: Partial<ModuleInput>) => apiData<Module>(api.put(`/modules/${id}`, input)),
  delete: (id: string) => apiData<{ id: string }>(api.delete(`/modules/${id}`)),
};

import { api, apiData } from "./api";
import type { User } from "../types";

export const authService = {
  async me() {
    return apiData<{ user: User }>(api.get("/auth/me"));
  },
  async login(email: string, password: string) {
    return apiData<{ user: User }>(api.post("/auth/login", { email, password }));
  },
  async register(name: string, email: string, password: string) {
    return apiData<{ user: User }>(api.post("/auth/register", { name, email, password }));
  },
  async logout() {
    return apiData<{ message: string }>(api.post("/auth/logout"));
  },
};

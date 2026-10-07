import { api, apiData } from "./api";
import type { UpcomingClass, UpcomingClassStatus } from "../types";

export interface UpcomingClassInput {
  title: string;
  description: string;
  thumbnail?: string | null;
  instructorName: string;
  daysOfWeek: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  instructorId?: string | null;
  courseId?: string | null;
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  maxParticipants?: number | null;
  notes?: string | null;
  status: UpcomingClassStatus;
}

export interface UpcomingClassFilters {
  search?: string;
  status?: UpcomingClassStatus;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface ClassPage {
  data: UpcomingClass[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const upcomingClassService = {
  upcoming: async (page = 1, limit = 4) => {
    const response = await api.get<ClassPage>("/classes/upcoming", { params: { page, limit } });
    return { items: response.data.data, pagination: response.data.pagination };
  },
  list: async (filters: UpcomingClassFilters = {}) => {
    const response = await api.get<ClassPage>("/admin/classes", { params: { limit: 20, ...filters } });
    return { items: response.data.data, pagination: response.data.pagination };
  },
  get: (id: string) => apiData<UpcomingClass>(api.get(`/classes/${id}`)),
  getAdmin: (id: string) => apiData<UpcomingClass>(api.get(`/admin/classes/${id}`)),
  create: (input: UpcomingClassInput) => apiData<UpcomingClass>(api.post("/admin/classes", input)),
  update: (id: string, input: Partial<UpcomingClassInput>) =>
    apiData<UpcomingClass>(api.put(`/admin/classes/${id}`, input)),
  delete: (id: string) => apiData<{ id: string }>(api.delete(`/admin/classes/${id}`)),
  instructors: () => apiData<Array<{ id: string; name: string; role: string; isActive: boolean }>>(api.get("/admin/users?limit=100")),
};

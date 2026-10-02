import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string") error.message = message;
    }
    return Promise.reject(error);
  },
);

export async function apiData<T>(request: Promise<{ data: unknown }>): Promise<T> {
  const response = await request;
  const body = response.data;
  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new Error("The API returned an unexpected response. Check that the backend is running and /api is routed to it.");
  }
  return body.data as T;
}

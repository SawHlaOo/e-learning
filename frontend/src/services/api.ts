import axios from "axios";

const apiBaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || "/api"
  : "/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

type ApiErrorBody = {
  code?: unknown;
  errors?: unknown;
};

function validationMessage(errors: unknown) {
  if (!errors || typeof errors !== "object") return null;
  for (const messages of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0];
  }
  return null;
}

function friendlyApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again.";
  if (!error.response) return "We couldn’t connect to the service. Please try again shortly.";

  const body = error.response.data as ApiErrorBody | undefined;
  const code = typeof body?.code === "string" ? body.code : "";
  if (code === "VALIDATION_ERROR") return validationMessage(body?.errors) ?? "Please check the information and try again.";
  if (code === "UNAUTHORIZED") return "Please sign in to continue.";
  if (code === "FORBIDDEN") return "You don’t have permission to do that.";
  if (code === "NOT_FOUND") return "The requested item is no longer available.";
  if (code === "CONFLICT" || code === "RELATION_CONFLICT") return "This change conflicts with existing information. Please review and try again.";
  if (code.startsWith("DATABASE_") || error.response.status >= 500) return "The service is temporarily unavailable. Please try again later.";
  return "We couldn’t complete that request. Please check your information and try again.";
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      error.message = friendlyApiError(error);
    }
    return Promise.reject(error);
  },
);

export async function apiData<T>(request: Promise<{ data: unknown }>): Promise<T> {
  const response = await request;
  const body = response.data;
  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new Error("We couldn’t load the information. Please try again shortly.");
  }
  return body.data as T;
}

import { env } from "../config/env";

const settings: Record<string, number> = {
  API_RATE_WINDOW_MS: env.API_RATE_WINDOW_MS,
  API_RATE_LIMIT: env.API_RATE_LIMIT,
  AUTH_RATE_WINDOW_MS: env.AUTH_RATE_WINDOW_MS,
  AUTH_RATE_LIMIT: env.AUTH_RATE_LIMIT,
};

export function rateLimitSetting(name: keyof typeof settings) {
  return settings[name];
}

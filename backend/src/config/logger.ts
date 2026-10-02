import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL ?? (env.NODE_ENV === "development" ? "debug" : "info"),
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "passwordHash", "token", "DATABASE_URL"],
    censor: "[REDACTED]",
  },
});

import dotenv from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

dotenv.config({
  path: [resolve(process.cwd(), ".env"), resolve(__dirname, "../../../.env")],
  quiet: true,
});

const optionalSecret = z.string().optional().refine(
  (value) => !value || value.trim().length >= 32,
  "JWT_SECRET must contain at least 32 characters",
);

const optionalOrigin = z.string().optional().refine(
  (value) => !value || value === "" || z.url().safeParse(value).success,
  "CLIENT_URL must be a valid absolute URL",
);

const integerSetting = (fallback: number, maximum: number) =>
  z.preprocess(
    (value) => value === undefined || value === "" ? fallback : Number(value),
    z.number().int().min(1).max(maximum),
  );

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: optionalSecret,
  CLIENT_URL: optionalOrigin,
  PORT: integerSetting(5000, 65_535),
  API_RATE_WINDOW_MS: integerSetting(60_000, 86_400_000),
  API_RATE_LIMIT: integerSetting(300, 100_000),
  AUTH_RATE_WINDOW_MS: integerSetting(900_000, 86_400_000),
  AUTH_RATE_LIMIT: integerSetting(30, 10_000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && !value.JWT_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["JWT_SECRET"],
      message: "JWT_SECRET is required in production",
    });
  }
});

const parsedEnvironment = environmentSchema.safeParse(process.env);
if (!parsedEnvironment.success) {
  const errors = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${errors}`);
}

export const env = parsedEnvironment.data;

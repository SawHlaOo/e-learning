import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppError } from "./errors/app-error";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { rateLimitSetting } from "./utils/rate-limit";
import adminRouter from "./routes/admin.routes";
import authRouter from "./routes/auth.routes";
import certificateRouter from "./routes/certificate.routes";
import courseRouter from "./routes/course.routes";
import exerciseRouter from "./routes/exercise.routes";
import lessonRouter from "./routes/lesson.routes";
import learningResourceRouter from "./routes/learning-resource.routes";
import moduleRouter from "./routes/module.routes";
import progressRouter from "./routes/progress.routes";
import youTubeRouter from "./routes/youtube.routes";

const app = express();
const devLocalOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
]);
const allowedOrigins = new Set(
  [
    env.CLIENT_URL,
    ...(env.NODE_ENV === "production" ? [] : Array.from(devLocalOrigins)),
  ].filter((origin): origin is string => Boolean(origin)),
);

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
    if (!isLocalhost) return false;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return /^517\d+$/.test(parsed.port || "");
  } catch {
    return false;
  }
}

app.set("trust proxy", 1);
app.use(helmet());
app.use(requestLogger);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError("Origin is not allowed by CORS", 403, "CORS_ORIGIN_DENIED"));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});
app.get("/api/health/db", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: "ok" });
  } catch (error) {
    next(error);
  }
});

const apiLimiter = rateLimit({
  windowMs: rateLimitSetting("API_RATE_WINDOW_MS"),
  limit: rateLimitSetting("API_RATE_LIMIT"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests; try again later", code: "RATE_LIMITED" },
});
app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/courses", courseRouter);
app.use("/api/modules", moduleRouter);
app.use("/api/lessons", lessonRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/progress", progressRouter);
app.use("/api/youtube", youTubeRouter);
app.use("/api/admin/learning-resources", learningResourceRouter);
app.use("/api/admin", adminRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    code: "NOT_FOUND",
  });
});
app.use(errorHandler);

logger.debug("Express API configured");

export default app;

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
import moduleRouter from "./routes/module.routes";
import progressRouter from "./routes/progress.routes";
import quizRouter from "./routes/quiz.routes";
import youTubeRouter from "./routes/youtube.routes";

const app = express();
const allowedOrigins = new Set(
  [
    env.CLIENT_URL,
    ...(env.NODE_ENV === "production" ? [] : ["http://localhost:5173"]),
  ].filter((origin): origin is string => Boolean(origin)),
);

app.set("trust proxy", 1);
app.use(helmet());
app.use(requestLogger);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
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
app.use("/api/quizzes", quizRouter);
app.use("/api/progress", progressRouter);
app.use("/api/youtube", youTubeRouter);
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

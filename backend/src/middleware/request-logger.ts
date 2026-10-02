import type { RequestHandler } from "express";
import { logger } from "../config/logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info({
      method: req.method,
      endpoint: req.route?.path
        ? `${req.baseUrl}${req.route.path}`
        : req.path.replace(/[a-zA-Z0-9_-]{20,}/g, ":id"),
      statusCode: res.statusCode,
      responseTimeMs: Math.round(durationMs * 100) / 100,
    }, "HTTP request");
  });
  next();
};

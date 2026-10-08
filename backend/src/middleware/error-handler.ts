import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError, ValidationError } from "../errors/app-error";

function validationDetails(error: ZodError) {
  return error.issues.reduce<Record<string, string[]>>((details, issue) => {
    const path = issue.path.join(".") || "request";
    (details[path] ??= []).push(issue.message);
    return details;
  }, {});
}

function databaseError(error: Prisma.PrismaClientKnownRequestError): AppError | undefined {
  switch (error.code) {
    case "P2002":
      return new AppError("A resource with these details already exists", 409, "CONFLICT");
    case "P2025":
      return new AppError("Resource not found", 404, "NOT_FOUND");
    case "P2003":
      return new AppError("The request conflicts with related data", 409, "RELATION_CONFLICT");
    case "P1001":
    case "P1002":
    case "P1008":
    case "P1017":
      return new AppError("The database is currently unavailable", 503, "DATABASE_UNAVAILABLE");
    case "P2021":
    case "P2022":
      return new AppError(
        "The database schema is not initialized. Run the Prisma migrations.",
        503,
        "DATABASE_SCHEMA_NOT_INITIALIZED",
      );
    case "P2011":
    case "P2012":
    case "P2013":
    case "P2014":
    case "P2019":
    case "P2020":
      return new AppError("The database rejected the request", 400, "INVALID_DATABASE_INPUT");
    default:
      return undefined;
  }
}

function requestBodyError(error: unknown): AppError | undefined {
  if (typeof error !== "object" || error === null || !("type" in error)) return undefined;
  if (error.type === "entity.parse.failed") {
    return new AppError("Request body must contain valid JSON", 400, "INVALID_JSON");
  }
  if (error.type === "entity.too.large") {
    return new AppError("Request body is too large", 413, "PAYLOAD_TOO_LARGE");
  }
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: validationDetails(error),
    });
    return;
  }

  const bodyError = requestBodyError(error);
  if (bodyError) {
    res.status(bodyError.status).json({
      success: false,
      message: bodyError.message,
      code: bodyError.code,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error instanceof ValidationError && error.details ? { errors: error.details } : {}),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = databaseError(error);
    if (mapped) {
      res.status(mapped.status).json({ success: false, message: mapped.message, code: mapped.code });
      return;
    }
    logger.error({
      errorName: error.name,
      prismaCode: error.code,
      method: req.method,
      path: req.path,
    }, "Database request failed");
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_ERROR" });
    return;
  }

  const isInitializationError = error instanceof Error && error.name === "PrismaClientInitializationError";
  const isConnectionError =
    error instanceof Error &&
    /can't reach database server|timed out fetching a new connection|connection terminated|server has closed the connection|connection reset by peer|econnrefused/i.test(error.message);
  const databaseNotConfigured =
    isInitializationError && error.message.includes("Environment variable not found: DATABASE_URL");
  if (
    isInitializationError ||
    isConnectionError ||
    (error instanceof Error && error.name === "PrismaClientRustPanicError")
  ) {
    logger.error({ errorName: error.name }, "Database unavailable");
    res.status(503).json({
      success: false,
      message: databaseNotConfigured ? "DATABASE_URL is not configured" : "The database is currently unavailable",
      code: databaseNotConfigured ? "DATABASE_NOT_CONFIGURED" : "DATABASE_UNAVAILABLE",
    });
    return;
  }

  logger.error({
    errorName: error instanceof Error ? error.name : "UnknownError",
    method: req.method,
    path: req.path,
  }, "Unhandled request error");
  res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_ERROR" });
};

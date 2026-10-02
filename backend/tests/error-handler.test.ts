import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { errorHandler } from "../src/middleware/error-handler";

test("database connection failures return a sanitized service-unavailable response", () => {
  let statusCode = 0;
  let responseBody: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  errorHandler(
    new Error("Can't reach database server at 127.0.0.1:55432"),
    { method: "GET", path: "/api/courses" } as Request,
    response,
    () => undefined,
  );

  assert.equal(statusCode, 503);
  assert.deepEqual(responseBody, {
    success: false,
    message: "The database is currently unavailable",
    code: "DATABASE_UNAVAILABLE",
  });
});

test("database connection details are not included in API errors", () => {
  let responseBody = "";
  const response = {
    status() {
      return this;
    },
    json(body: unknown) {
      responseBody = JSON.stringify(body);
      return this;
    },
  } as unknown as Response;

  errorHandler(
    new Error("Can't reach database server at 127.0.0.1:55432"),
    { method: "GET", path: "/api/courses" } as Request,
    response,
    () => undefined,
  );

  assert.equal(responseBody.includes("127.0.0.1"), false);
});

test("missing database tables return a clear migration-required response", () => {
  let statusCode = 0;
  let responseBody: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  errorHandler(
    new Prisma.PrismaClientKnownRequestError("The table `public.Course` does not exist", {
      code: "P2021",
      clientVersion: "test",
      meta: { table: "public.Course" },
    }),
    { method: "GET", path: "/api/courses" } as Request,
    response,
    () => undefined,
  );

  assert.equal(statusCode, 503);
  assert.deepEqual(responseBody, {
    success: false,
    message: "The database schema is not initialized. Run the Prisma migrations.",
    code: "DATABASE_SCHEMA_NOT_INITIALIZED",
  });
});

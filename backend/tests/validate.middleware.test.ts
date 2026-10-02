import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { validate } from "../src/middleware/validate";
import { validatedInput } from "../src/utils/request-input";
import { idParamsSchema, paginationQuerySchema } from "../src/validators/common.validator";
import { loginBodySchema } from "../src/validators/auth.validator";

test("query validation stores normalized input where controllers expect it", () => {
  const response = { locals: {} } as Response;
  let nextCalled = false;

  validate("query", paginationQuerySchema)(
    { query: { page: "2", limit: "10" } } as unknown as Request,
    response,
    (() => { nextCalled = true; }) as NextFunction,
  );

  assert.equal(nextCalled, true);
  assert.deepEqual(response.locals.query, { page: 2, limit: 10 });
  assert.deepEqual(
    validatedInput<{ page: number; limit: number }>(response, "query"),
    { page: 2, limit: 10 },
  );
});

test("parameter validation stores normalized input where controllers expect it", () => {
  const response = { locals: {} } as Response;
  let nextCalled = false;

  validate("params", idParamsSchema)(
    { params: { id: " course-1 " } } as unknown as Request,
    response,
    (() => { nextCalled = true; }) as NextFunction,
  );

  assert.equal(nextCalled, true);
  assert.deepEqual(response.locals.params, { id: "course-1" });
  assert.deepEqual(validatedInput<{ id: string }>(response, "params"), { id: "course-1" });
});

test("body validation stores parsed input where controllers expect it", () => {
  const response = { locals: {} } as Response;
  let nextCalled = false;
  const body = { email: "admin@example.com", password: "a-safe-password" };

  validate("body", loginBodySchema)(
    { body } as Request,
    response,
    (() => { nextCalled = true; }) as NextFunction,
  );

  assert.equal(nextCalled, true);
  assert.deepEqual(response.locals.body, body);
  assert.deepEqual(validatedInput(response, "body"), body);
});

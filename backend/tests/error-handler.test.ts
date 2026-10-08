import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { errorHandler } from "../src/middleware/error-handler";

function responseCapture() {
  const result: { status?: number; body?: unknown } = {};
  const response = {
    status(status: number) {
      result.status = status;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };
  return { result, response: response as unknown as Response };
}

function parserError(type: string) {
  return Object.assign(new Error("parser error"), { type });
}

test("malformed JSON is reported as a client error", () => {
  const { result, response } = responseCapture();
  errorHandler(parserError("entity.parse.failed"), { method: "POST", path: "/api/test" } as Request, response, () => {});
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    success: false,
    message: "Request body must contain valid JSON",
    code: "INVALID_JSON",
  });
});

test("oversized JSON is reported with 413", () => {
  const { result, response } = responseCapture();
  errorHandler(parserError("entity.too.large"), { method: "POST", path: "/api/test" } as Request, response, () => {});
  assert.equal(result.status, 413);
  assert.deepEqual(result.body, {
    success: false,
    message: "Request body is too large",
    code: "PAYLOAD_TOO_LARGE",
  });
});

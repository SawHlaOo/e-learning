import assert from "node:assert/strict";
import { test } from "node:test";
import { paginationQuerySchema } from "../src/validators/common.validator";
import { paginationResult } from "../src/utils/pagination";

test("pagination defaults are bounded and return total-page metadata", () => {
  const page = paginationQuerySchema.parse({});
  assert.deepEqual(page, { page: 1, limit: 20 });
  assert.deepEqual(paginationResult({ page: 2, limit: 20 }, 45), {
    page: 2,
    limit: 20,
    total: 45,
    totalPages: 3,
  });
});

test("pagination rejects invalid pages and limits above 100", () => {
  assert.equal(paginationQuerySchema.safeParse({ page: 0 }).success, false);
  assert.equal(paginationQuerySchema.safeParse({ limit: 101 }).success, false);
  assert.equal(paginationQuerySchema.safeParse({ limit: "not-a-number" }).success, false);
});

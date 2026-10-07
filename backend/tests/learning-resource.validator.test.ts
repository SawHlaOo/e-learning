import assert from "node:assert/strict";
import test from "node:test";
import {
  createLearningResourceBodySchema,
  learningResourceListQuerySchema,
  updateLearningResourceBodySchema,
} from "../src/validators/learning-resource.validator";

const validResource = {
  title: "  React project  ",
  description: "  Practice React  ",
  url: "  https://example.com/resource  ",
  type: "GITHUB",
  order: 1,
  lessonId: "lesson-1",
};

test("learning resource URLs are trimmed and accept HTTP(S)", () => {
  const result = createLearningResourceBodySchema.safeParse(validResource);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.title, "React project");
  assert.equal(result.data.description, "Practice React");
  assert.equal(result.data.url, "https://example.com/resource");
  assert.equal(createLearningResourceBodySchema.safeParse({
    ...validResource,
    url: "http://example.com/resource",
  }).success, true);
});

test("learning resource URLs reject malformed and dangerous schemes", () => {
  for (const url of ["not a URL", "javascript:alert(1)", "data:text/html,example", "vbscript:msgbox(1)"]) {
    assert.equal(createLearningResourceBodySchema.safeParse({ ...validResource, url }).success, false, url);
  }
});

test("resource updates require at least one valid field", () => {
  assert.equal(updateLearningResourceBodySchema.safeParse({}).success, false);
  assert.equal(updateLearningResourceBodySchema.safeParse({ isPublished: false }).success, true);
});

test("resource filters accept known types and reject unsupported types", () => {
  assert.equal(learningResourceListQuerySchema.safeParse({ type: "PDF" }).success, true);
  assert.equal(learningResourceListQuerySchema.safeParse({ type: "ARCHIVE" }).success, false);
});

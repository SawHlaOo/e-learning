import assert from "node:assert/strict";
import { test } from "node:test";
import { thumbnailUrlSchema } from "../src/validators/course.validator";

test("course thumbnail URL accepts HTTP(S) URLs and an empty value", () => {
  for (const value of ["https://cdn.example.com/course.jpg", "http://images.example.com/course.png", ""]) {
    assert.equal(thumbnailUrlSchema.safeParse(value).success, true, value);
  }
});

test("course thumbnail URL rejects non-HTTP protocols", () => {
  for (const value of ["javascript:alert(1)", "data:image/png;base64,abc", "ftp://images.example.com/course.jpg"]) {
    assert.equal(thumbnailUrlSchema.safeParse(value).success, false, value);
  }
});

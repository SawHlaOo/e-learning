import assert from "node:assert/strict";
import test from "node:test";
import { createLessonBodySchema } from "../src/validators/learning.validator";
import { createVideoBodySchema } from "../src/validators/youtube.validator";

test("lesson YouTube URLs must use HTTP or HTTPS and a supported host", () => {
  const lesson = {
    title: "Video lesson",
    slug: "video-lesson",
    order: 1,
    moduleId: "module-id",
  };

  assert.equal(createLessonBodySchema.safeParse({
    ...lesson,
    youtubeUrl: "https://www.youtube.com/watch?v=abc123",
  }).success, true);
  assert.equal(createLessonBodySchema.safeParse({
    ...lesson,
    youtubeUrl: "javascript://www.youtube.com/watch?v=abc123",
  }).success, false);
  assert.equal(createLessonBodySchema.safeParse({
    ...lesson,
    youtubeUrl: "https://example.com/watch?v=abc123",
  }).success, false);
});

test("public video URLs reject non-HTTP schemes even when their host and ID match", () => {
  assert.equal(createVideoBodySchema.safeParse({
    title: "Video",
    youtubeUrl: "https://www.youtube.com/watch?v=abc123",
    youtubeVideoId: "abc123",
  }).success, true);
  assert.equal(createVideoBodySchema.safeParse({
    title: "Video",
    youtubeUrl: "javascript://youtube.com/watch?v=abc123",
    youtubeVideoId: "abc123",
  }).success, false);
});

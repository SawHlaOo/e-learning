import assert from "node:assert/strict";
import { test } from "node:test";
import { youtubeUrlSchema } from "../src/validators/learning.validator";

test("YouTube URL validation accepts supported video URL formats", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=abc_123",
    "https://youtu.be/abc_123",
    "https://youtube.com/shorts/abc_123",
    "https://www.youtube.com/embed/abc_123",
  ]) {
    assert.equal(youtubeUrlSchema.safeParse(url).success, true, url);
  }
});

test("YouTube URL validation rejects non-YouTube and invalid video URLs", () => {
  for (const url of [
    "https://example.com/watch?v=abc_123",
    "https://youtube.com.evil.example/watch?v=abc_123",
    "https://youtube.com/watch",
    "https://youtu.be/",
  ]) {
    assert.equal(youtubeUrlSchema.safeParse(url).success, false, url);
  }
});

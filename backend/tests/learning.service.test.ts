import assert from "node:assert/strict";
import { test } from "node:test";
import { Role } from "@prisma/client";
import { LessonService, QuizService } from "../src/services/learning.service";
import { ModuleService } from "../src/services/module.service";
import type { LessonRepository, QuizRepository } from "../src/repositories/learning.repository";
import type { ModuleRepository } from "../src/repositories/module.repository";

test("lesson creation uses the same published content defaults as the seeded course", async () => {
  let created: Record<string, unknown> | undefined;
  const repository = {
    findModuleOwner: async () => ({ title: "Numbers and arithmetic", authorId: "admin-1" }),
    create: async (lesson: Record<string, unknown>) => {
      created = lesson;
      return lesson;
    },
  } as unknown as LessonRepository;
  const service = new LessonService(repository);

  await service.create({
    title: "Adding numbers",
    slug: "adding-numbers",
    moduleId: "module-1",
    order: 1,
  }, "admin-1", Role.ADMIN);

  assert.equal(created?.published, true);
  assert.equal(created?.durationMinutes, 10);
  assert.equal(
    created?.content,
    "Adding numbers is part of Numbers and arithmetic. Work through the examples, then try the practice exercise before moving on.",
  );
});

test("lesson creation preserves explicit draft and content settings", async () => {
  let created: Record<string, unknown> | undefined;
  const repository = {
    findModuleOwner: async () => ({ title: "Module one", authorId: "admin-1" }),
    create: async (lesson: Record<string, unknown>) => {
      created = lesson;
      return lesson;
    },
  } as unknown as LessonRepository;
  const service = new LessonService(repository);

  await service.create({
    title: "Private lesson",
    slug: "private-lesson",
    moduleId: "module-1",
    order: 1,
    content: "Draft notes",
    published: false,
    durationMinutes: 25,
  }, "admin-1", Role.ADMIN);

  assert.equal(created?.published, false);
  assert.equal(created?.content, "Draft notes");
  assert.equal(created?.durationMinutes, 25);
});

test("module creation supplies the standard curriculum description when blank", async () => {
  let created: Record<string, unknown> | undefined;
  const repository = {
    findCourseOwner: async () => ({ authorId: "admin-1" }),
    create: async (module: Record<string, unknown>) => {
      created = module;
      return module;
    },
  } as unknown as ModuleRepository;
  const service = new ModuleService(repository);

  await service.create({
    title: "Variables and data types",
    description: "",
    order: 1,
    courseId: "course-1",
  }, "admin-1", Role.ADMIN);

  assert.equal(created?.description, "A practical module covering variables and data types.");
});

test("quiz service calculates scores from server-side answers", async () => {
  let persisted: Record<string, unknown> | undefined;
  const repository = {
    findPublishedWithAnswers: async () => ({
      id: "quiz-1",
      passingPercentage: 50,
      questions: [
        { id: "question-1", correctAnswer: 1 },
        { id: "question-2", correctAnswer: 0 },
      ],
    }),
    createAttempt: async (attempt: Record<string, unknown>) => {
      persisted = attempt;
      return { id: "attempt-1", score: attempt.score, passed: attempt.passed, createdAt: new Date() };
    },
  } as unknown as QuizRepository;
  const service = new QuizService(repository);

  const result = await service.submit("student-1", "quiz-1", {
    "question-1": 1,
    "question-2": 1,
  });
  assert.equal(result.score, 50);
  assert.equal(result.passed, true);
  assert.equal(result.correctAnswers, 1);
  assert.equal(persisted?.userId, "student-1");
});

test("quiz service rejects incomplete or foreign-question submissions", async () => {
  let attemptCreated = false;
  const repository = {
    findPublishedWithAnswers: async () => ({
      id: "quiz-1",
      passingPercentage: 70,
      questions: [
        { id: "question-1", correctAnswer: 1 },
        { id: "question-2", correctAnswer: 0 },
      ],
    }),
    createAttempt: async () => { attemptCreated = true; },
  } as unknown as QuizRepository;
  const service = new QuizService(repository);

  await assert.rejects(service.submit("student-1", "quiz-1", { "question-1": 1 }));
  await assert.rejects(service.submit("student-1", "quiz-1", {
    "question-1": 1,
    "question-2": 0,
    "another-quiz-question": 0,
  }));
  assert.equal(attemptCreated, false);
});

test("quiz service returns a per-user result summary without exposing answers", async () => {
  const repository = {
    findPublishedById: async () => ({
      id: "quiz-1",
      title: "Python basics",
      passingPercentage: 70,
      questions: [],
    }),
    findAttemptsForUser: async () => [
      { id: "attempt-1", score: 50, percentage: 50, passed: false, correctCount: 1, incorrectCount: 1, createdAt: new Date("2024-01-01") },
      { id: "attempt-2", score: 90, percentage: 90, passed: true, correctCount: 2, incorrectCount: 0, createdAt: new Date("2024-01-02") },
    ],
  } as unknown as QuizRepository;
  const service = new QuizService(repository);

  const result = await service.getResults("student-1", "quiz-1");
  assert.equal(result.attemptCount, 2);
  assert.equal(result.bestScore, 90);
  assert.equal(result.attempts[0].score, 90);
  assert.equal(result.attempts[0].passed, true);
  assert.equal(result.title, "Python basics");
});

test("quiz service honors question points and rejects duplicate multiple-choice values", async () => {
  const repository = {
    findPublishedWithAnswers: async () => ({
      id: "quiz-2",
      passingPercentage: 70,
      questions: [
        { id: "question-1", type: "SINGLE_CHOICE", correctAnswer: 0, points: 1 },
        { id: "question-2", type: "MULTIPLE_CHOICE", correctAnswer: [1, 2], points: 3 },
      ],
    }),
    createAttempt: async (attempt: Record<string, unknown>) => ({ id: "attempt-2", ...attempt, createdAt: new Date() }),
  } as unknown as QuizRepository;
  const service = new QuizService(repository);

  const result = await service.submit("student-1", "quiz-2", {
    "question-1": 0,
    "question-2": [1, 1],
  });
  assert.equal(result.score, 25);
  assert.equal(result.correctAnswers, 1);
});

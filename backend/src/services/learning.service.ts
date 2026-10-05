import { Role, type Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/app-error";
import type {
  ExerciseRepository,
  LessonRepository,
  ProgressRepository,
  QuizRepository,
} from "../repositories/learning.repository";
import { paginationResult, type PageInput } from "../utils/pagination";

export class LessonService {
  constructor(private readonly lessons: LessonRepository) {}

  async get(id: string) {
    const lesson = await this.lessons.findPublishedById(id);
    if (!lesson) throw new NotFoundError("Lesson not found");
    return lesson;
  }

  async create(input: Prisma.LessonUncheckedCreateInput, userId: string, role: Role) {
    const module = await this.lessons.findModuleOwner(input.moduleId);
    if (!module) throw new NotFoundError("Module not found");
    this.assertOwnership(module.authorId, userId, role);
    const title = input.title.trim();
    return this.lessons.create({
      ...input,
      title,
      content: input.content?.trim() || `${title} is part of ${module.title}. Work through the examples, then try the practice exercise before moving on.`,
      published: input.published ?? true,
      durationMinutes: input.durationMinutes ?? 10,
    });
  }

  async update(id: string, input: Prisma.LessonUpdateInput, userId: string, role: Role) {
    const lesson = await this.lessons.findOwnership(id);
    if (!lesson) throw new NotFoundError("Lesson not found");
    this.assertOwnership(lesson.module.course.authorId, userId, role);
    return this.lessons.update(id, input);
  }

  async delete(id: string, userId: string, role: Role) {
    const lesson = await this.lessons.findOwnership(id);
    if (!lesson) throw new NotFoundError("Lesson not found");
    this.assertOwnership(lesson.module.course.authorId, userId, role);
    return this.lessons.delete(id);
  }

  private assertOwnership(authorId: string, userId: string, role: Role) {
    if (role !== Role.ADMIN && authorId !== userId) {
      throw new ForbiddenError("You cannot manage this lesson");
    }
  }
}

export class ExerciseService {
  constructor(private readonly exercises: ExerciseRepository) {}

  async list(page: PageInput) {
    const result = await this.exercises.findPublished(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async get(id: string) {
    const exercise = await this.exercises.findPublishedById(id);
    if (!exercise) throw new NotFoundError("Exercise not found");
    return exercise;
  }

  async submit(userId: string, id: string, code: string) {
    const exercise = await this.exercises.findPublishedById(id);
    if (!exercise) throw new NotFoundError("Exercise not found");
    return this.exercises.createSubmission(userId, id, code);
  }
}

type QuizAnswerValue = number | string | boolean | Array<number> | Array<string> | Array<boolean>;

function normalizeScalar(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((entry) => normalizeScalar(entry)).join("|");
  return JSON.stringify(value ?? "");
}

function normalizeList(value: unknown): Array<string> {
  if (Array.isArray(value)) return value.map((entry) => normalizeScalar(entry));
  return [normalizeScalar(value)];
}

function isAnswerCorrect(question: { correctAnswer?: unknown; acceptedAnswers?: unknown; type?: string }, submitted: unknown) {
  const correctCandidates = [question.correctAnswer, question.acceptedAnswers].filter((candidate) => candidate !== undefined && candidate !== null);
  const acceptedValues = correctCandidates.length > 0
    ? correctCandidates.flatMap((candidate) => Array.isArray(candidate) ? candidate : [candidate])
    : [];

  if (acceptedValues.length === 0) return false;

  const submittedNormalized = normalizeList(submitted);
  const expectedNormalized = acceptedValues.flatMap((candidate) => normalizeList(candidate));

  switch (question.type) {
    case "MULTIPLE_CHOICE":
      // Treat selections as a set. This prevents duplicate values in a forged
      // request from being accepted as a correct answer.
      return submittedNormalized.length > 0
        && new Set(submittedNormalized).size === new Set(expectedNormalized).size
        && submittedNormalized.length === expectedNormalized.length
        && expectedNormalized.every((value) => submittedNormalized.includes(value));
    case "TRUE_FALSE":
      return submittedNormalized[0] === expectedNormalized[0];
    case "FILL_BLANK":
      return expectedNormalized.some((value) => submittedNormalized.includes(value));
    default:
      return submittedNormalized[0] === expectedNormalized[0];
  }
}

export class QuizService {
  constructor(private readonly quizzes: QuizRepository) {}

  async list(page: PageInput) {
    const result = await this.quizzes.findPublished(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async get(id: string) {
    const quiz = await this.quizzes.findPublishedById(id);
    if (!quiz) throw new NotFoundError("Quiz not found");
    return {
      ...quiz,
      questions: quiz.questions.map(({ correctAnswer, acceptedAnswers, explanation, ...question }) => question),
    };
  }

  async getResults(userId: string, quizId: string) {
    const quiz = await this.quizzes.findPublishedById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");
    const attempts = [...await this.quizzes.findAttemptsForUser(quizId, userId)].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
    const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
    return {
      quizId,
      title: quiz.title,
      passingPercentage: quiz.passingPercentage,
      attemptCount: attempts.length,
      bestScore,
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        createdAt: attempt.createdAt,
      })),
    };
  }

  async submit(userId: string, quizId: string, answers: Record<string, QuizAnswerValue>) {
    const quiz = await this.quizzes.findPublishedWithAnswers(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");
    if (!quiz.questions.length) throw new NotFoundError("Quiz has no questions");
    const questionIds = new Set(quiz.questions.map((question) => question.id));
    if (Object.keys(answers).some((questionId) => !questionIds.has(questionId))) {
      throw new ValidationError("Submission contains a question from another quiz");
    }
    if (quiz.questions.some((question) => !(question.id in answers))) {
      throw new ValidationError("Answer every question before submitting the quiz");
    }
    const correctQuestions = quiz.questions.filter((question) => isAnswerCorrect(question, answers[question.id]));
    const correct = correctQuestions.length;
    const pointsFor = (question: { points?: number | null }) => Math.max(0, question.points ?? 1);
    const totalPoints = quiz.questions.reduce((sum, question) => sum + pointsFor(question), 0);
    const earnedPoints = correctQuestions.reduce((sum, question) => sum + pointsFor(question), 0);
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const attempt = await this.quizzes.createAttempt({
      quizId,
      userId,
      score,
      percentage: score,
      passed: score >= quiz.passingPercentage,
      correctCount: correct,
      incorrectCount: quiz.questions.length - correct,
      answers,
    });
    return { ...attempt, correctAnswers: correct, totalQuestions: quiz.questions.length };
  }
}

export class ProgressService {
  constructor(private readonly progress: ProgressRepository) {}

  async get(userId: string, page: PageInput) {
    const [[enrollments, lessonProgress, exerciseSubmissions, quizAttempts, totals], allQuizAttempts] =
      await Promise.all([this.progress.findForUser(userId, page), this.progress.findQuizSummary(userId)]);
    const quizSummary = new Map<string, { quizId: string; title: string; attempts: number; bestScore: number; latestScore: number; passed: boolean }>();
    for (const attempt of allQuizAttempts) {
      const current = quizSummary.get(attempt.quizId);
      const score = attempt.percentage ?? attempt.score;
      if (!current) {
        quizSummary.set(attempt.quizId, { quizId: attempt.quizId, title: attempt.quiz.title, attempts: 1, bestScore: score, latestScore: score, passed: attempt.passed });
      } else {
        current.attempts += 1;
        current.bestScore = Math.max(current.bestScore, score);
        current.passed ||= attempt.passed;
        // Results are ordered newest first by the repository.
      }
    }
    return {
      data: { enrollments, lessonProgress, exerciseSubmissions, quizAttempts, quizSummary: Array.from(quizSummary.values()) },
      pagination: {
        enrollments: paginationResult(page, totals[0]),
        lessonProgress: paginationResult(page, totals[1]),
        exerciseSubmissions: paginationResult(page, totals[2]),
        quizAttempts: paginationResult(page, totals[3]),
      },
    };
  }

  async updateLesson(userId: string, lessonId: string, completed: boolean) {
    const progress = await this.progress.completeLesson(userId, lessonId, completed);
    if (!progress) throw new NotFoundError("Lesson not found or course enrollment is required");
    return progress;
  }
}

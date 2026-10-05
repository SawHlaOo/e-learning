import { z } from "zod";

export const studentStatusBodySchema = z.object({ isActive: z.boolean() });
export const certificateCodeParamsSchema = z.object({
  code: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9-]+$/),
});

const quizQuestionTypeSchema = z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "CODE"]);
const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
const jsonValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown()), z.record(z.string(), z.unknown())]);

export const createQuizBodySchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().max(10000).optional().default(""),
  instructions: z.string().max(10000).optional().default(""),
  difficulty: difficultySchema.optional().default("EASY"),
  passingPercentage: z.number().int().min(0).max(100).default(70),
  timeLimitMinutes: z.number().int().min(0).max(1440).default(0),
  randomizeQuestions: z.boolean().default(false),
  randomizeAnswers: z.boolean().default(false),
  isActive: z.boolean().default(true),
  published: z.boolean().default(false),
  lessonId: z.string().trim().min(1).max(191).nullable().optional(),
});

export const updateQuizBodySchema = createQuizBodySchema.partial();

const quizQuestionBaseSchema = z.object({
  type: quizQuestionTypeSchema.default("SINGLE_CHOICE"),
  prompt: z.string().trim().min(2).max(20000),
  options: z.array(jsonValueSchema).max(50).default([]),
  correctAnswer: jsonValueSchema.optional().nullable(),
  acceptedAnswers: z.array(jsonValueSchema).max(50).optional().nullable(),
  explanation: z.string().max(10000).optional().nullable(),
  hint: z.string().max(10000).optional().nullable(),
  points: z.number().int().min(0).max(10000).default(10),
  difficulty: difficultySchema.optional().default("EASY"),
  codeSnippet: z.string().max(30000).optional().nullable(),
  mediaUrl: z.string().url().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(1),
});

export const createQuizQuestionBodySchema = quizQuestionBaseSchema.superRefine((value, context) => {
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(value.type) && value.options.length === 0) {
    context.addIssue({ code: "custom", path: ["options"], message: "Choice questions need at least one option" });
  }
  if (value.correctAnswer === undefined || value.correctAnswer === null) {
    context.addIssue({ code: "custom", path: ["correctAnswer"], message: "A correct answer is required" });
  }
  if (value.type === "MULTIPLE_CHOICE" && !Array.isArray(value.correctAnswer)) {
    context.addIssue({ code: "custom", path: ["correctAnswer"], message: "Multiple-choice answers must be an array" });
  }
});

export const updateQuizQuestionBodySchema = quizQuestionBaseSchema.partial();

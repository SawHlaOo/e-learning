import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const httpUrlSchema = z.string().trim().pipe(z.url()).refine(
  (value) => /^https?:\/\//i.test(value),
  "URL must use HTTP or HTTPS",
);

const thumbnailSchema = z.union([z.literal(""), httpUrlSchema]).nullable().optional();

export const learningResourceTypeSchema = z.enum([
  "GITHUB",
  "YOUTUBE",
  "DOCUMENTATION",
  "ARTICLE",
  "WEBSITE",
  "COURSE",
  "PDF",
  "OTHER",
]);

export const learningResourceListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(160).optional(),
  type: learningResourceTypeSchema.optional(),
  courseId: z.string().trim().min(1).max(191).optional(),
  lessonId: z.string().trim().min(1).max(191).optional(),
});

export const createLearningResourceBodySchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(10000).optional(),
  url: httpUrlSchema,
  type: learningResourceTypeSchema,
  thumbnail: thumbnailSchema,
  order: z.number().int().min(1).max(100000),
  isPublished: z.boolean().optional(),
  lessonId: z.string().trim().min(1).max(191),
});

export const updateLearningResourceBodySchema = createLearningResourceBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

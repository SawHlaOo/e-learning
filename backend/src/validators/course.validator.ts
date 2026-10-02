import { z } from "zod";

const youtubeUrl = z.url().optional().or(z.literal(""));
export const thumbnailUrlSchema = z.union([
  z.literal(""),
  z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Thumbnail must use HTTP or HTTPS"),
]).optional();

export const createCourseBodySchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(3).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(20000),
  summary: z.string().max(500).optional(),
  level: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  thumbnail: thumbnailUrlSchema,
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  estimatedHours: z.number().int().min(0).max(10000).optional(),
});

export const updateCourseBodySchema = createCourseBodySchema.partial();

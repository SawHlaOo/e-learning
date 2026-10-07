import { z } from "zod";

export const youtubeUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") return url.pathname.length > 1;
  if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) return false;
  return url.pathname === "/watch"
    ? Boolean(url.searchParams.get("v"))
    : /^\/(?:embed|shorts|live)\/[^/]+/.test(url.pathname);
}, "Enter a valid YouTube video URL");

export const githubRepositoryUrlSchema = z.string().trim().pipe(z.url()).refine((value) => {
  const url = new URL(value);
  if (url.protocol !== "https:") return false;
  if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return false;
  return /^\/[^/]+\/[^/]+(?:\/|$)/.test(url.pathname);
}, "Enter a valid GitHub repository URL");

export const createModuleBodySchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().max(10000).optional(),
  order: z.number().int().min(1),
  courseId: z.string().trim().min(1).max(191),
});

export const updateModuleBodySchema = createModuleBodySchema.omit({ courseId: true }).partial();

export const createLessonBodySchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().max(50000).optional(),
  order: z.number().int().min(1),
  published: z.boolean().optional(),
  durationMinutes: z.number().int().min(0).max(10000).optional(),
  youtubeUrl: youtubeUrlSchema.optional(),
  githubRepositoryUrl: githubRepositoryUrlSchema.optional(),
  moduleId: z.string().trim().min(1).max(191),
});

export const updateLessonBodySchema = createLessonBodySchema
  .omit({ moduleId: true })
  .partial()
  .extend({ youtubeUrl: youtubeUrlSchema.nullable().optional(), githubRepositoryUrl: githubRepositoryUrlSchema.nullable().optional() });

export const exerciseSubmissionBodySchema = z.object({
  code: z.string().min(1).max(20000),
});

export const lessonProgressBodySchema = z.object({
  lessonId: z.string().trim().min(1).max(191),
  completed: z.boolean().optional().default(true),
});

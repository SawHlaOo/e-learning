import { z } from "zod";

const videoFields = z.object({
  title: z.string().trim().min(2).max(160),
  youtubeUrl: z.url(),
  youtubeVideoId: z.string().trim().min(6).max(20),
  description: z.string().max(10000).optional(),
  thumbnail: z.url().optional().or(z.literal("")),
  duration: z.number().int().positive().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  lessonId: z.string().trim().max(191).optional().nullable(),
});

export const createVideoBodySchema = videoFields.refine(
  ({ youtubeUrl, youtubeVideoId }) => youtubeIdFromUrl(youtubeUrl) === youtubeVideoId,
  { path: ["youtubeVideoId"], message: "Video ID must match the YouTube URL" },
);

function youtubeIdFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
      return url.pathname.slice(1);
    }
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/);
      return match?.[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export const updateVideoBodySchema = videoFields.partial().refine(
  ({ youtubeUrl, youtubeVideoId }) =>
    !youtubeUrl || !youtubeVideoId || youtubeIdFromUrl(youtubeUrl) === youtubeVideoId,
  { path: ["youtubeVideoId"], message: "Video ID must match the YouTube URL" },
);

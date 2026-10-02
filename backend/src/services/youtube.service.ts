import { Role, type Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/app-error";
import type { YouTubeRepository } from "../repositories/youtube.repository";
import { paginationResult, type PageInput } from "../utils/pagination";

export class YouTubeService {
  constructor(private readonly videos: YouTubeRepository) {}

  async list(page: PageInput) {
    const result = await this.videos.findPublished(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  create(
    input: Omit<Prisma.YouTubeVideoUncheckedCreateInput, "authorId">,
    authorId: string,
    role: Role,
  ) {
    return this.createOwned(input, authorId, role);
  }

  private async createOwned(
    input: Omit<Prisma.YouTubeVideoUncheckedCreateInput, "authorId">,
    authorId: string,
    role: Role,
  ) {
    this.assertMatchingVideo(input.youtubeUrl, input.youtubeVideoId);
    if (input.lessonId) {
      const lesson = await this.videos.findLessonOwner(input.lessonId);
      if (!lesson) throw new NotFoundError("Lesson not found");
      this.assertOwnership(lesson.authorId, authorId, role);
    }
    return this.videos.create({ ...input, authorId });
  }

  async update(id: string, input: Prisma.YouTubeVideoUncheckedUpdateInput, userId: string, role: Role) {
    const video = await this.videos.findById(id);
    if (!video) throw new NotFoundError("Video not found");
    this.assertOwnership(video.authorId, userId, role);
    const youtubeUrl = typeof input.youtubeUrl === "string" ? input.youtubeUrl : video.youtubeUrl;
    const youtubeVideoId = typeof input.youtubeVideoId === "string"
      ? input.youtubeVideoId
      : video.youtubeVideoId;
    this.assertMatchingVideo(youtubeUrl, youtubeVideoId);
    if (typeof input.lessonId === "string") {
      const lesson = await this.videos.findLessonOwner(input.lessonId);
      if (!lesson) throw new NotFoundError("Lesson not found");
      this.assertOwnership(lesson.authorId, userId, role);
    }
    return this.videos.update(id, input);
  }

  async delete(id: string, userId: string, role: Role) {
    const video = await this.videos.findById(id);
    if (!video) throw new NotFoundError("Video not found");
    this.assertOwnership(video.authorId, userId, role);
    return this.videos.delete(id);
  }

  private assertOwnership(authorId: string, userId: string, role: Role) {
    if (role !== Role.ADMIN && authorId !== userId) {
      throw new ForbiddenError("You cannot manage this video");
    }
  }

  private assertMatchingVideo(url: string, videoId: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ValidationError("A valid YouTube URL is required");
    }
    let id: string | null = null;
    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      id = parsed.pathname.slice(1);
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) {
      if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
      else id = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1] ?? null;
    }
    if (id !== videoId) throw new ValidationError("Video ID must match the YouTube URL");
  }
}

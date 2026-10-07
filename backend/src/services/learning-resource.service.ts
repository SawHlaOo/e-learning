import type { LearningResourceType, Prisma } from "@prisma/client";
import { NotFoundError } from "../errors/app-error";
import type {
  LearningResourceFilters,
  LearningResourceRepository,
} from "../repositories/learning-resource.repository";
import { paginationResult, type PageInput } from "../utils/pagination";

export interface LearningResourceInput {
  title: string;
  description?: string;
  url: string;
  type: LearningResourceType;
  thumbnail?: string | null;
  order: number;
  isPublished?: boolean;
  lessonId: string;
}

export class LearningResourceService {
  constructor(private readonly resources: LearningResourceRepository) {}

  async list(filters: LearningResourceFilters) {
    const result = await this.resources.findMany(filters);
    const page: PageInput = { page: filters.page, limit: filters.limit };
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async get(id: string) {
    const resource = await this.resources.findById(id);
    if (!resource) throw new NotFoundError("Learning resource not found");
    return resource;
  }

  async create(input: LearningResourceInput) {
    if (!await this.resources.findLessonById(input.lessonId)) {
      throw new NotFoundError("Lesson not found");
    }
    const data: Prisma.LearningResourceUncheckedCreateInput = {
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      url: input.url.trim(),
      type: input.type,
      thumbnail: input.thumbnail?.trim() || null,
      order: input.order,
      isPublished: input.isPublished ?? false,
      lessonId: input.lessonId,
    };
    return this.resources.create(data);
  }

  async update(id: string, input: Partial<LearningResourceInput>) {
    await this.get(id);
    if (input.lessonId && !await this.resources.findLessonById(input.lessonId)) {
      throw new NotFoundError("Lesson not found");
    }
    const data: Prisma.LearningResourceUncheckedUpdateInput = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.url !== undefined ? { url: input.url.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.thumbnail !== undefined ? { thumbnail: input.thumbnail?.trim() || null } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      ...(input.lessonId !== undefined ? { lessonId: input.lessonId } : {}),
    };
    return this.resources.update(id, data);
  }

  async delete(id: string) {
    await this.get(id);
    return this.resources.delete(id);
  }
}

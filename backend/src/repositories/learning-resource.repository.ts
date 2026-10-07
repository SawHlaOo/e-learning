import { Prisma, type LearningResourceType } from "@prisma/client";
import { prisma } from "../config/database";
import type { PageInput } from "../utils/pagination";

export interface LearningResourceFilters extends PageInput {
  search?: string;
  type?: LearningResourceType;
  courseId?: string;
  lessonId?: string;
}

const adminResourceSelection = {
  id: true,
  title: true,
  description: true,
  url: true,
  type: true,
  thumbnail: true,
  order: true,
  isPublished: true,
  lessonId: true,
  createdAt: true,
  updatedAt: true,
  lesson: {
    select: {
      id: true,
      title: true,
      module: {
        select: {
          id: true,
          title: true,
          course: { select: { id: true, title: true } },
        },
      },
    },
  },
} satisfies Prisma.LearningResourceSelect;

export class LearningResourceRepository {
  async findMany(filters: LearningResourceFilters) {
    const where: Prisma.LearningResourceWhereInput = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.lessonId ? { lessonId: filters.lessonId } : {}),
      ...(filters.courseId ? { lesson: { module: { courseId: filters.courseId } } } : {}),
      ...(filters.search ? {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.learningResource.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: adminResourceSelection,
        orderBy: [{ lessonId: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.learningResource.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.learningResource.findUnique({
      where: { id },
      select: adminResourceSelection,
    });
  }

  findLessonById(id: string) {
    return prisma.lesson.findUnique({ where: { id }, select: { id: true } });
  }

  create(data: Prisma.LearningResourceUncheckedCreateInput) {
    return prisma.learningResource.create({
      data,
      select: adminResourceSelection,
    });
  }

  update(id: string, data: Prisma.LearningResourceUncheckedUpdateInput) {
    return prisma.learningResource.update({
      where: { id },
      data,
      select: adminResourceSelection,
    });
  }

  delete(id: string) {
    return prisma.learningResource.delete({ where: { id }, select: { id: true } });
  }
}

export const learningResourceRepository = new LearningResourceRepository();

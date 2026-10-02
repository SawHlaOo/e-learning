import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { PageInput } from "../utils/pagination";

export class CourseRepository {
  async findPublished(page: PageInput) {
    const where = { published: true };
    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: {
          id: true, title: true, slug: true, summary: true, description: true,
          level: true, thumbnail: true, featured: true, estimatedHours: true,
          telegramEnrollmentEnabled: true,
          _count: { select: { modules: true, enrollments: true } },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.course.count({ where }),
    ]);
    return { items, total };
  }

  findPublishedById(id: string) {
    return prisma.course.findFirst({
      where: { id, published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        summary: true,
        level: true,
        thumbnail: true,
        published: true,
        featured: true,
        telegramEnrollmentEnabled: true,
        estimatedHours: true,
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { published: true },
              orderBy: { order: "asc" },
              select: { id: true, title: true, slug: true, order: true, durationMinutes: true },
            },
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.course.findUnique({ where: { id }, select: { id: true, authorId: true } });
  }

  create(data: Prisma.CourseUncheckedCreateInput) {
    return prisma.course.create({ data });
  }

  update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.course.delete({ where: { id }, select: { id: true } });
  }

  enroll(userId: string, courseId: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.findFirst({
        where: { id: courseId, published: true },
        select: { id: true },
      });
      if (!course) return null;
      return tx.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
      });
    });
  }
}

export const courseRepository = new CourseRepository();

import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export class ModuleRepository {
  findPublishedById(id: string) {
    return prisma.module.findFirst({
      where: { id, course: { published: true } },
      select: {
        id: true, title: true, description: true, order: true,
        lessons: {
          where: { published: true },
          select: { id: true, title: true, slug: true, order: true, durationMinutes: true },
          orderBy: { order: "asc" },
        },
      },
    });
  }

  findCourseOwner(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      select: { authorId: true },
    });
  }

  findById(id: string) {
    return prisma.module.findUnique({
      where: { id },
      select: { id: true, course: { select: { authorId: true } } },
    });
  }

  create(data: Prisma.ModuleUncheckedCreateInput) {
    return prisma.module.create({ data });
  }

  update(id: string, data: Prisma.ModuleUpdateInput) {
    return prisma.module.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.module.delete({ where: { id }, select: { id: true } });
  }
}

export const moduleRepository = new ModuleRepository();

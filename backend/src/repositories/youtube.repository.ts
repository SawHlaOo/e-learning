import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { PageInput } from "../utils/pagination";

export class YouTubeRepository {
  async findPublished(page: PageInput) {
    const where = { published: true };
    const [items, total] = await Promise.all([
      prisma.youTubeVideo.findMany({
        where,
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: {
          id: true, title: true, youtubeUrl: true, youtubeVideoId: true,
          description: true, thumbnail: true, duration: true, featured: true, createdAt: true,
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.youTubeVideo.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.youTubeVideo.findUnique({
      where: { id },
      select: { id: true, authorId: true, youtubeUrl: true, youtubeVideoId: true },
    });
  }

  findLessonOwner(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      select: { module: { select: { course: { select: { authorId: true } } } } },
    }).then((lesson) => lesson && { authorId: lesson.module.course.authorId });
  }

  create(data: Prisma.YouTubeVideoUncheckedCreateInput) {
    return prisma.youTubeVideo.create({ data });
  }

  update(id: string, data: Prisma.YouTubeVideoUpdateInput) {
    return prisma.youTubeVideo.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.youTubeVideo.delete({ where: { id }, select: { id: true } });
  }
}

export const youTubeRepository = new YouTubeRepository();

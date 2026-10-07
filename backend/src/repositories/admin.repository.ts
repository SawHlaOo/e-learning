import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/database";
import type { PageInput } from "../utils/pagination";

export class AdminRepository {
  async findStudents(page: PageInput) {
    const where = { role: Role.STUDENT };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: {
          id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
          _count: { select: { enrollments: true, lessonProgress: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async findUsers(page: PageInput) {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: {
          id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);
    return { items, total };
  }

  findStudentById(id: string) {
    return prisma.user.findFirst({
      where: { id, role: Role.STUDENT },
      select: { id: true },
    });
  }

  async findCourses(page: PageInput) {
    const [items, total] = await Promise.all([
      prisma.course.findMany({
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: {
          id: true, title: true, slug: true, level: true, published: true, telegramEnrollmentEnabled: true, createdAt: true,
          _count: { select: { modules: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.count(),
    ]);
    return { items, total };
  }

  findCourseForEditing(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                slug: true,
                content: true,
                order: true,
                published: true,
                durationMinutes: true,
                youtubeUrl: true,
                moduleId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
  }

  async analytics() {
    const [totalStudents, activeStudents, totalCourses, totalLessons, totalExercises, totalVideos, totalCertificates, enrollments, completedEnrollments] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.STUDENT, isActive: true } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.exercise.count(),
      prisma.youTubeVideo.count(),
      prisma.certificate.count(),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: "COMPLETED" } }),
    ]);
    return {
      totalStudents, activeStudents, totalCourses, totalLessons, totalExercises,
      totalVideos, totalCertificates, enrollments, completedEnrollments,
    };
  }

  setStudentStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id, role: Role.STUDENT },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

}

export const adminRepository = new AdminRepository();

import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "../config/database";
import type { PageInput } from "../utils/pagination";

export class LessonRepository {
  findPublishedById(id: string) { return prisma.lesson.findFirst({ where: { id, published: true }, select: { id: true, title: true, slug: true, content: true, order: true, published: true, durationMinutes: true, youtubeUrl: true, moduleId: true, createdAt: true, updatedAt: true, module: { select: { id: true, title: true, courseId: true } }, resources: { where: { isPublished: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, title: true, description: true, url: true, type: true, thumbnail: true, order: true } }, exercises: { where: { published: true }, select: { id: true, title: true, description: true, difficulty: true, instructions: true, starterCode: true, hint: true, points: true } } } }); }
  findOwnership(id: string) { return prisma.lesson.findUnique({ where: { id }, select: { id: true, module: { select: { course: { select: { authorId: true } } } } } }); }
  findModuleOwner(moduleId: string) { return prisma.module.findUnique({ where: { id: moduleId }, select: { title: true, course: { select: { authorId: true } } } }).then((module) => module && { title: module.title, authorId: module.course.authorId }); }
  findLessonOwner(lessonId: string) { return prisma.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { course: { select: { authorId: true } } } } } }).then((lesson) => lesson && { authorId: lesson.module.course.authorId }); }
  create(data: PrismaTypes.LessonUncheckedCreateInput) { return prisma.lesson.create({ data }); }
  update(id: string, data: Prisma.LessonUpdateInput) { return prisma.lesson.update({ where: { id }, data }); }
  delete(id: string) { return prisma.lesson.delete({ where: { id }, select: { id: true } }); }
}

export class ExerciseRepository {
  async findPublished(page: PageInput) { const where = { published: true }; const [items, total] = await Promise.all([prisma.exercise.findMany({ where, skip: (page.page - 1) * page.limit, take: page.limit, select: { id: true, title: true, description: true, difficulty: true, instructions: true, starterCode: true, hint: true, points: true, lessonId: true }, orderBy: { createdAt: "desc" } }), prisma.exercise.count({ where })]); return { items, total }; }
  findPublishedById(id: string) { return prisma.exercise.findFirst({ where: { id, published: true }, select: { id: true, title: true, description: true, difficulty: true, instructions: true, starterCode: true, hint: true, points: true } }); }
  createSubmission(userId: string, exerciseId: string, code: string) { return prisma.exerciseSubmission.create({ data: { exerciseId, userId, code, feedback: "Submission saved. Code execution is not enabled on this API." }, select: { id: true, isPassed: true, feedback: true, createdAt: true } }); }
}

export class ProgressRepository {
  findForUser(userId: string, page: PageInput) { const skip = (page.page - 1) * page.limit; return Promise.all([
    prisma.enrollment.findMany({ where: { userId }, skip, take: page.limit, include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } }, orderBy: { enrolledAt: "desc" } }),
    prisma.lessonProgress.findMany({ where: { userId }, skip, take: page.limit, include: { lesson: { select: { id: true, title: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.exerciseSubmission.findMany({ where: { userId }, skip, take: page.limit, select: { id: true, exerciseId: true, isPassed: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.$transaction([prisma.enrollment.count({ where: { userId } }), prisma.lessonProgress.count({ where: { userId } }), prisma.exerciseSubmission.count({ where: { userId } })]),
  ]); }
  completeLesson(userId: string, lessonId: string, completed: boolean) { const operation = () => prisma.$transaction(async (tx) => { const lesson = await tx.lesson.findFirst({ where: { id: lessonId, published: true, module: { course: { enrollments: { some: { userId, status: "ACTIVE" } } } } }, select: { id: true, module: { select: { courseId: true } } } }); if (!lesson) return null; const progress = await tx.lessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId } }, create: { userId, lessonId, completed, completedAt: completed ? new Date() : null }, update: { completed, completedAt: completed ? new Date() : null } }); if (completed) { const [totalLessons, completedLessons] = await Promise.all([tx.lesson.count({ where: { module: { courseId: lesson.module.courseId }, published: true } }), tx.lessonProgress.count({ where: { userId, completed: true, lesson: { published: true, module: { courseId: lesson.module.courseId } } } })]); if (totalLessons > 0 && completedLessons >= totalLessons) { const now = new Date(); await tx.enrollment.updateMany({ where: { userId, courseId: lesson.module.courseId, status: "ACTIVE" }, data: { status: "COMPLETED", completedAt: now } }); await tx.certificate.upsert({ where: { userId_courseId: { userId, courseId: lesson.module.courseId } }, create: { userId, courseId: lesson.module.courseId, code: `PY-${now.getFullYear()}-${randomBytes(8).toString("hex").toUpperCase()}` }, update: {} }); } } return progress; }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); return operation().catch(async (error: unknown) => { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return operation(); throw error; }); }
}

export const lessonRepository = new LessonRepository();
export const exerciseRepository = new ExerciseRepository();
export const progressRepository = new ProgressRepository();

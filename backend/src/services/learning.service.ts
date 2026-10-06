import { Role, type Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../errors/app-error";
import type { ExerciseRepository, LessonRepository, ProgressRepository } from "../repositories/learning.repository";
import { paginationResult, type PageInput } from "../utils/pagination";

export class LessonService {
  constructor(private readonly lessons: LessonRepository) {}
  async get(id: string) { const lesson = await this.lessons.findPublishedById(id); if (!lesson) throw new NotFoundError("Lesson not found"); return lesson; }
  async create(input: Prisma.LessonUncheckedCreateInput, userId: string, role: Role) { const module = await this.lessons.findModuleOwner(input.moduleId); if (!module) throw new NotFoundError("Module not found"); this.assertOwnership(module.authorId, userId, role); const title = input.title.trim(); return this.lessons.create({ ...input, title, content: input.content?.trim() || `${title} is part of ${module.title}. Work through the examples, then try the practice exercise before moving on.`, published: input.published ?? true, durationMinutes: input.durationMinutes ?? 10 }); }
  async update(id: string, input: Prisma.LessonUpdateInput, userId: string, role: Role) { const lesson = await this.lessons.findOwnership(id); if (!lesson) throw new NotFoundError("Lesson not found"); this.assertOwnership(lesson.module.course.authorId, userId, role); return this.lessons.update(id, input); }
  async delete(id: string, userId: string, role: Role) { const lesson = await this.lessons.findOwnership(id); if (!lesson) throw new NotFoundError("Lesson not found"); this.assertOwnership(lesson.module.course.authorId, userId, role); return this.lessons.delete(id); }
  private assertOwnership(authorId: string, userId: string, role: Role) { if (role !== Role.ADMIN && authorId !== userId) throw new ForbiddenError("You cannot manage this lesson"); }
}

export class ExerciseService {
  constructor(private readonly exercises: ExerciseRepository) {}
  async list(page: PageInput) { const result = await this.exercises.findPublished(page); return { items: result.items, pagination: paginationResult(page, result.total) }; }
  async get(id: string) { const exercise = await this.exercises.findPublishedById(id); if (!exercise) throw new NotFoundError("Exercise not found"); return exercise; }
  async submit(userId: string, id: string, code: string) { const exercise = await this.exercises.findPublishedById(id); if (!exercise) throw new NotFoundError("Exercise not found"); return this.exercises.createSubmission(userId, id, code); }
}

export class ProgressService {
  constructor(private readonly progress: ProgressRepository) {}
  async get(userId: string, page: PageInput) { const [enrollments, lessonProgress, exerciseSubmissions, totals] = await this.progress.findForUser(userId, page); return { data: { enrollments, lessonProgress, exerciseSubmissions }, pagination: { enrollments: paginationResult(page, totals[0]), lessonProgress: paginationResult(page, totals[1]), exerciseSubmissions: paginationResult(page, totals[2]) } }; }
  async updateLesson(userId: string, lessonId: string, completed: boolean) { const progress = await this.progress.completeLesson(userId, lessonId, completed); if (!progress) throw new NotFoundError("Lesson not found or course enrollment is required"); return progress; }
}

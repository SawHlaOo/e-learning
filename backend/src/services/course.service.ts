import { Role, type Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../errors/app-error";
import type { CourseRepository } from "../repositories/course.repository";
import { paginationResult, type PageInput } from "../utils/pagination";

export class CourseService {
  constructor(private readonly courses: CourseRepository) {}

  async list(page: PageInput) {
    const result = await this.courses.findPublished(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async get(id: string) {
    const course = await this.courses.findPublishedById(id);
    if (!course) throw new NotFoundError("Course not found");
    return course;
  }

  create(input: Omit<Prisma.CourseUncheckedCreateInput, "authorId">, authorId: string) {
    return this.courses.create({ ...input, authorId });
  }

  async update(id: string, input: Prisma.CourseUpdateInput, userId: string, role: Role) {
    const existing = await this.courses.findById(id);
    if (!existing) throw new NotFoundError("Course not found");
    this.assertOwnership(existing.authorId, userId, role);
    return this.courses.update(id, input);
  }

  async delete(id: string, userId: string, role: Role) {
    const existing = await this.courses.findById(id);
    if (!existing) throw new NotFoundError("Course not found");
    this.assertOwnership(existing.authorId, userId, role);
    return this.courses.delete(id);
  }

  async enroll(userId: string, courseId: string) {
    const enrollment = await this.courses.enroll(userId, courseId);
    if (!enrollment) throw new NotFoundError("Course not found");
    return enrollment;
  }

  private assertOwnership(authorId: string, userId: string, role: Role) {
    if (role !== Role.ADMIN && authorId !== userId) {
      throw new ForbiddenError("You cannot manage this course");
    }
  }
}

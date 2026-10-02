import { Role, type Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../errors/app-error";
import type { ModuleRepository } from "../repositories/module.repository";

export class ModuleService {
  constructor(private readonly modules: ModuleRepository) {}

  async get(id: string) {
    const module = await this.modules.findPublishedById(id);
    if (!module) throw new NotFoundError("Module not found");
    return module;
  }

  async create(input: Prisma.ModuleUncheckedCreateInput, userId: string, role: Role) {
    const course = await this.modules.findCourseOwner(input.courseId);
    if (!course) throw new NotFoundError("Course not found");
    this.assertOwnership(course.authorId, userId, role);
    return this.modules.create({
      ...input,
      description: input.description?.trim() || `A practical module covering ${input.title.toLowerCase()}.`,
    });
  }

  async update(id: string, input: Prisma.ModuleUpdateInput, userId: string, role: Role) {
    const module = await this.modules.findById(id);
    if (!module) throw new NotFoundError("Module not found");
    this.assertOwnership(module.course.authorId, userId, role);
    return this.modules.update(id, input);
  }

  async delete(id: string, userId: string, role: Role) {
    const module = await this.modules.findById(id);
    if (!module) throw new NotFoundError("Module not found");
    this.assertOwnership(module.course.authorId, userId, role);
    return this.modules.delete(id);
  }

  private assertOwnership(authorId: string, userId: string, role: Role) {
    if (role !== Role.ADMIN && authorId !== userId) {
      throw new ForbiddenError("You cannot manage this module");
    }
  }
}

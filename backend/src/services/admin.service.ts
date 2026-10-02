import type { AdminRepository } from "../repositories/admin.repository";
import { NotFoundError } from "../errors/app-error";
import { paginationResult, type PageInput } from "../utils/pagination";

export class AdminService {
  constructor(
    private readonly admin: AdminRepository,
  ) {}

  async students(page: PageInput) {
    const result = await this.admin.findStudents(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async users(page: PageInput) {
    const result = await this.admin.findUsers(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async coursesList(page: PageInput) {
    const result = await this.admin.findCourses(page);
    return { items: result.items, pagination: paginationResult(page, result.total) };
  }

  async courseForEditing(id: string) {
    const course = await this.admin.findCourseForEditing(id);
    if (!course) throw new NotFoundError("Course not found");
    return course;
  }

  analytics() {
    return this.admin.analytics();
  }

  async setStudentStatus(id: string, isActive: boolean) {
    const student = await this.admin.findStudentById(id);
    if (!student) throw new NotFoundError("Student not found");
    return this.admin.setStudentStatus(id, isActive);
  }
}

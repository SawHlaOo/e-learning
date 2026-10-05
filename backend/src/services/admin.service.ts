import type { AdminRepository } from "../repositories/admin.repository";
import { NotFoundError } from "../errors/app-error";
import type { Prisma } from "@prisma/client";
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

  quizzes() {
    return this.admin.findQuizzes();
  }

  async quiz(id: string) {
    const quiz = await this.admin.findQuiz(id);
    if (!quiz) throw new NotFoundError("Quiz not found");
    return quiz;
  }

  createQuiz(input: Prisma.QuizUncheckedCreateInput) {
    return this.admin.createQuiz(input);
  }

  async updateQuiz(id: string, input: Prisma.QuizUpdateInput) {
    await this.quiz(id);
    return this.admin.updateQuiz(id, input);
  }

  async deleteQuiz(id: string) {
    await this.quiz(id);
    return this.admin.deleteQuiz(id);
  }

  async createQuizQuestion(quizId: string, input: Omit<Prisma.QuizQuestionUncheckedCreateInput, "quizId">) {
    await this.quiz(quizId);
    return this.admin.createQuizQuestion({ ...input, quizId });
  }

  async updateQuizQuestion(id: string, input: Prisma.QuizQuestionUpdateInput) {
    return this.admin.updateQuizQuestion(id, input);
  }

  deleteQuizQuestion(id: string) {
    return this.admin.deleteQuizQuestion(id);
  }
}

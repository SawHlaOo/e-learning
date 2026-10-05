import type { Request, Response } from "express";
import { adminService } from "../services";
import { success } from "../utils/http";
import type { PageInput } from "../utils/pagination";
import { validatedInput } from "../utils/request-input";
import type { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import type { createQuizBodySchema, createQuizQuestionBodySchema, studentStatusBodySchema, updateQuizBodySchema, updateQuizQuestionBodySchema } from "../validators/admin.validator";
import type { z } from "zod";
import type { Prisma } from "@prisma/client";

export class AdminController {
  students = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await adminService.students(page);
    return success(res, result.items, 200, result.pagination);
  };

  users = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await adminService.users(page);
    return success(res, result.items, 200, result.pagination);
  };

  courses = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await adminService.coursesList(page);
    return success(res, result.items, 200, result.pagination);
  };

  course = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await adminService.courseForEditing(id));
  };

  analytics = async (_req: Request, res: Response) => success(res, await adminService.analytics());

  setStudentStatus = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const { isActive } = validatedInput<z.infer<typeof studentStatusBodySchema>>(res, "body");
    return success(res, await adminService.setStudentStatus(id, isActive));
  };

  quizzes = async (_req: Request, res: Response) => success(res, await adminService.quizzes());

  quiz = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await adminService.quiz(id));
  };

  createQuiz = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createQuizBodySchema>>(res, "body");
    return success(res, await adminService.createQuiz(input), 201);
  };

  updateQuiz = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateQuizBodySchema>>(res, "body");
    return success(res, await adminService.updateQuiz(id, input));
  };

  deleteQuiz = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await adminService.deleteQuiz(id));
  };

  createQuizQuestion = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof createQuizQuestionBodySchema>>(res, "body");
    return success(res, await adminService.createQuizQuestion(id, input as unknown as Omit<Prisma.QuizQuestionUncheckedCreateInput, "quizId">), 201);
  };

  updateQuizQuestion = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateQuizQuestionBodySchema>>(res, "body");
    return success(res, await adminService.updateQuizQuestion(id, input as unknown as Prisma.QuizQuestionUpdateInput));
  };

  deleteQuizQuestion = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await adminService.deleteQuizQuestion(id));
  };
}

export const adminController = new AdminController();

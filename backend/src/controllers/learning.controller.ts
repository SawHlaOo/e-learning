import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { exerciseService, lessonService, moduleService, progressService, quizService } from "../services";
import { success } from "../utils/http";
import type { PageInput } from "../utils/pagination";
import { validatedInput } from "../utils/request-input";
import type { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import type {
  createLessonBodySchema,
  createModuleBodySchema,
  exerciseSubmissionBodySchema,
  lessonProgressBodySchema,
  quizAttemptBodySchema,
  updateLessonBodySchema,
  updateModuleBodySchema,
} from "../validators/learning.validator";
import type { z } from "zod";

export class ModuleController {
  get = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await moduleService.get(id));
  };

  create = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createModuleBodySchema>>(res, "body");
    return success(res, await moduleService.create(input, req.auth!.userId, req.auth!.role as Role), 201);
  };

  update = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateModuleBodySchema>>(res, "body");
    return success(res, await moduleService.update(id, input, req.auth!.userId, req.auth!.role as Role));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await moduleService.delete(id, req.auth!.userId, req.auth!.role as Role));
  };
}

export class LessonController {
  get = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await lessonService.get(id));
  };

  create = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createLessonBodySchema>>(res, "body");
    return success(res, await lessonService.create(input, req.auth!.userId, req.auth!.role as Role), 201);
  };

  update = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateLessonBodySchema>>(res, "body");
    return success(res, await lessonService.update(id, input, req.auth!.userId, req.auth!.role as Role));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await lessonService.delete(id, req.auth!.userId, req.auth!.role as Role));
  };
}

export class ExerciseController {
  list = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await exerciseService.list(page);
    return success(res, result.items, 200, result.pagination);
  };

  get = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await exerciseService.get(id));
  };

  submit = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const { code } = validatedInput<z.infer<typeof exerciseSubmissionBodySchema>>(res, "body");
    return success(res, await exerciseService.submit(req.auth!.userId, id, code), 201);
  };
}

export class QuizController {
  list = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await quizService.list(page);
    return success(res, result.items, 200, result.pagination);
  };

  get = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await quizService.get(id));
  };

  submit = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const { answers } = validatedInput<z.infer<typeof quizAttemptBodySchema>>(res, "body");
    return success(res, await quizService.submit(req.auth!.userId, id, answers), 201);
  };
}

export class ProgressController {
  get = async (req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await progressService.get(req.auth!.userId, page);
    return success(res, result.data, 200, result.pagination);
  };

  updateLesson = async (req: Request, res: Response) => {
    const { lessonId, completed } = validatedInput<z.infer<typeof lessonProgressBodySchema>>(res, "body");
    return success(res, await progressService.updateLesson(req.auth!.userId, lessonId, completed));
  };
}

export const moduleController = new ModuleController();
export const lessonController = new LessonController();
export const exerciseController = new ExerciseController();
export const quizController = new QuizController();
export const progressController = new ProgressController();

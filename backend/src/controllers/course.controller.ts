import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { courseService } from "../services";
import { success } from "../utils/http";
import { validatedInput } from "../utils/request-input";
import type { PageInput } from "../utils/pagination";
import type { createCourseBodySchema, updateCourseBodySchema } from "../validators/course.validator";
import type { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import type { z } from "zod";

export class CourseController {
  list = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await courseService.list(page);
    return success(res, result.items, 200, result.pagination);
  };

  get = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await courseService.get(id));
  };

  enroll = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await courseService.enroll(req.auth!.userId, id), 201);
  };

  create = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createCourseBodySchema>>(res, "body");
    return success(res, await courseService.create(input, req.auth!.userId), 201);
  };

  update = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateCourseBodySchema>>(res, "body");
    return success(res, await courseService.update(id, input, req.auth!.userId, req.auth!.role as Role));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await courseService.delete(id, req.auth!.userId, req.auth!.role as Role));
  };
}

export const courseController = new CourseController();

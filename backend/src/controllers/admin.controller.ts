import type { Request, Response } from "express";
import { adminService } from "../services";
import { success } from "../utils/http";
import type { PageInput } from "../utils/pagination";
import { validatedInput } from "../utils/request-input";
import type { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import type { studentStatusBodySchema } from "../validators/admin.validator";
import type { z } from "zod";

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

}

export const adminController = new AdminController();

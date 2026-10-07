import type { Request, Response } from "express";
import type { z } from "zod";
import { upcomingClassService } from "../services";
import { success } from "../utils/http";
import type { PageInput } from "../utils/pagination";
import { validatedInput } from "../utils/request-input";
import type { idParamsSchema } from "../validators/common.validator";
import type {
  createUpcomingClassBodySchema,
  upcomingClassListQuerySchema,
  updateUpcomingClassBodySchema,
} from "../validators/upcoming-class.validator";

export class UpcomingClassController {
  listUpcoming = async (_req: Request, res: Response) => {
    const query = validatedInput<z.infer<typeof upcomingClassListQuerySchema>>(res, "query");
    const page: PageInput = { page: query.page, limit: query.limit };
    const result = await upcomingClassService.upcoming(page);
    return success(res, result.items, 200, result.pagination);
  };

  listClasses = async (_req: Request, res: Response) => {
    const query = validatedInput<z.infer<typeof upcomingClassListQuerySchema>>(res, "query");
    const page: PageInput = { page: query.page, limit: query.limit };
    const result = await upcomingClassService.publicClasses(page);
    return success(res, result.items, 200, result.pagination);
  };

  listAdmin = async (_req: Request, res: Response) => {
    const query = validatedInput<z.infer<typeof upcomingClassListQuerySchema>>(res, "query");
    const result = await upcomingClassService.list(query);
    return success(res, result.items, 200, result.pagination);
  };

  get = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await upcomingClassService.get(id));
  };

  getAdmin = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await upcomingClassService.get(id, true));
  };

  create = async (_req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createUpcomingClassBodySchema>>(res, "body");
    return success(res, await upcomingClassService.create(input), 201);
  };

  update = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateUpcomingClassBodySchema>>(res, "body");
    return success(res, await upcomingClassService.update(id, input));
  };

  delete = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await upcomingClassService.delete(id));
  };
}

export const upcomingClassController = new UpcomingClassController();

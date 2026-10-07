import type { Request, Response } from "express";
import type { z } from "zod";
import { learningResourceService } from "../services";
import { success } from "../utils/http";
import { validatedInput } from "../utils/request-input";
import type { idParamsSchema } from "../validators/common.validator";
import type {
  createLearningResourceBodySchema,
  learningResourceListQuerySchema,
  updateLearningResourceBodySchema,
} from "../validators/learning-resource.validator";

export class LearningResourceController {
  list = async (_req: Request, res: Response) => {
    const query = validatedInput<z.infer<typeof learningResourceListQuerySchema>>(res, "query");
    const result = await learningResourceService.list(query);
    return success(res, result.items, 200, result.pagination);
  };

  get = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await learningResourceService.get(id));
  };

  create = async (_req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createLearningResourceBodySchema>>(res, "body");
    return success(res, await learningResourceService.create(input), 201);
  };

  update = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateLearningResourceBodySchema>>(res, "body");
    return success(res, await learningResourceService.update(id, input));
  };

  delete = async (_req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await learningResourceService.delete(id));
  };
}

export const learningResourceController = new LearningResourceController();

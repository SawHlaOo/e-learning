import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { youTubeService } from "../services";
import { success } from "../utils/http";
import type { PageInput } from "../utils/pagination";
import { validatedInput } from "../utils/request-input";
import type { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import type { createVideoBodySchema, updateVideoBodySchema } from "../validators/youtube.validator";
import type { z } from "zod";

export class YouTubeController {
  list = async (_req: Request, res: Response) => {
    const page = validatedInput<z.infer<typeof paginationQuerySchema>>(res, "query") as PageInput;
    const result = await youTubeService.list(page);
    return success(res, result.items, 200, result.pagination);
  };

  create = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof createVideoBodySchema>>(res, "body");
    return success(res, await youTubeService.create(input, req.auth!.userId, req.auth!.role as Role), 201);
  };

  update = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    const input = validatedInput<z.infer<typeof updateVideoBodySchema>>(res, "body");
    return success(res, await youTubeService.update(id, input, req.auth!.userId, req.auth!.role as Role));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = validatedInput<z.infer<typeof idParamsSchema>>(res, "params");
    return success(res, await youTubeService.delete(id, req.auth!.userId, req.auth!.role as Role));
  };
}

export const youTubeController = new YouTubeController();

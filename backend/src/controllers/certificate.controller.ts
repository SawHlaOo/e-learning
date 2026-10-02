import type { Request, Response } from "express";
import { certificateService } from "../services";
import { success } from "../utils/http";
import { validatedInput } from "../utils/request-input";
import type { certificateCodeParamsSchema } from "../validators/admin.validator";
import type { z } from "zod";

export class CertificateController {
  list = async (req: Request, res: Response) =>
    success(res, await certificateService.listForUser(req.auth!.userId));

  verify = async (req: Request, res: Response) => {
    const { code } = validatedInput<z.infer<typeof certificateCodeParamsSchema>>(res, "params");
    return success(res, await certificateService.verify(code));
  };
}

export const certificateController = new CertificateController();

import { z } from "zod";

export const studentStatusBodySchema = z.object({ isActive: z.boolean() });
export const certificateCodeParamsSchema = z.object({
  code: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9-]+$/),
});

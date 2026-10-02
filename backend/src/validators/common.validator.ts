import { z } from "zod";

export const idParamsSchema = z.object({ id: z.string().trim().min(1).max(191) });
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

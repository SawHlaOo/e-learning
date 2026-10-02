import { z } from "zod";

export const registerBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export const loginBodySchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

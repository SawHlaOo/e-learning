import type { Request, Response } from "express";
import { AUTH_COOKIE, cookieOptions } from "../middleware/authenticate";
import { authService } from "../services";
import { validatedInput } from "../utils/request-input";
import type { loginBodySchema, registerBodySchema } from "../validators/auth.validator";
import { success } from "../utils/http";
import type { z } from "zod";

export class AuthController {
  register = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof registerBodySchema>>(res, "body");
    const result = await authService.register(input);
    res.cookie(AUTH_COOKIE, result.token, cookieOptions());
    return success(res, { user: result.user }, 201);
  };

  login = async (req: Request, res: Response) => {
    const input = validatedInput<z.infer<typeof loginBodySchema>>(res, "body");
    const result = await authService.login(input);
    res.cookie(AUTH_COOKIE, result.token, cookieOptions());
    return success(res, { user: result.user });
  };

  logout = (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
    return success(res, { message: "Logged out" });
  };

  me = async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    return success(res, { user: await authService.currentUserFromId(userId) });
  };
}

export const authController = new AuthController();

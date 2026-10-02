import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { authService } from "../services";
import { isInvalidTokenError } from "../utils/jwt";
import { env } from "../config/env";

export const AUTH_COOKIE = "python_course_token";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  const token = req.cookies?.[AUTH_COOKIE] ?? bearer;
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "UNAUTHORIZED",
    });
    return;
  }

  try {
    const user = await authService.currentUser(token);
    req.auth = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    if (isInvalidTokenError(error)) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session",
        code: "INVALID_SESSION",
      });
      return;
    }
    next(error);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to do this",
        code: "FORBIDDEN",
      });
      return;
    }
    next();
  };
}

export function cookieOptions() {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" as const : "lax" as const,
    path: "/api",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

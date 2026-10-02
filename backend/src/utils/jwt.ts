import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../errors/app-error";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new AppError("JWT_SECRET must contain at least 32 characters", 503, "CONFIGURATION_ERROR");
  }
  return value;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, secret());
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new jwt.JsonWebTokenError("Invalid token subject");
  }
  return payload;
}

export function isInvalidTokenError(error: unknown): boolean {
  return error instanceof jwt.JsonWebTokenError;
}

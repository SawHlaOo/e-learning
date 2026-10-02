import type { Response } from "express";
import type { Pagination } from "./pagination";

export function success<T>(
  res: Response,
  data: T,
  status = 200,
  pagination?: Pagination | Record<string, Pagination>,
) {
  return res.status(status).json({
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
  });
}

export function failure(
  res: Response,
  message: string,
  status = 400,
  code = status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
) {
  return res.status(status).json({ success: false, message, code });
}

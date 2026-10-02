import type { Request, RequestHandler, Response } from "express";

type AsyncController = (
  req: Request,
  res: Response,
) => Promise<unknown> | unknown;

export function asyncHandler(controller: AsyncController): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(controller(req, res)).catch(next);
  };
}

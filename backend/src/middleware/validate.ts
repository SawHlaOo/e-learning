import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export type ValidationTarget = "body" | "params" | "query";

export function validate(target: ValidationTarget, schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }

    if (target === "body") {
      req.body = result.data;
      res.locals.body = result.data;
    }
    else if (target === "params") {
      req.params = result.data as typeof req.params;
      res.locals.params = result.data;
    } else res.locals.query = result.data;

    next();
  };
}

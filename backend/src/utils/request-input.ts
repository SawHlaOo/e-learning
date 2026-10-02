import type { Response } from "express";

export function validatedInput<T>(res: Response, key: string): T {
  const value: unknown = res.locals[key];
  if (value === undefined) throw new Error(`Validated request input "${key}" is missing`);
  return value as T;
}

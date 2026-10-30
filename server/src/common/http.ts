import type { ErrorRequestHandler } from "express";
import {
  ConstraintViolationException,
  NotFoundError,
  UniqueConstraintViolationException,
  ValidationError,
} from "@mikro-orm/core";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, "Not found");
  return id;
}

// Copies only the whitelisted keys from a request body, so clients can't set id/timestamps.
export function pick(body: unknown, keys: readonly string[]): Record<string, any> {
  const source = (body ?? {}) as Record<string, unknown>;
  return Object.fromEntries(keys.filter((k) => k in source).map((k) => [k, source[k]]));
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  if (err instanceof HttpError) status = err.status;
  else if (err instanceof NotFoundError) status = 404;
  else if (err instanceof UniqueConstraintViolationException) status = 409;
  // Missing required fields, failed CHECKs, and Postgres "data exception" errors (bad date, bad number, ...).
  else if (err instanceof ValidationError || err instanceof ConstraintViolationException || err.code?.startsWith?.("22"))
    status = 400;

  if (status === 500) console.error(err);
  // First line only: MikroORM appends an entity dump / SQL detail on the following lines.
  res.status(status).json({ error: status === 500 ? "Internal server error" : String(err.message).split("\n")[0] });
};

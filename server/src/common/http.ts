import { STATUS_CODES } from "node:http";
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
  // Errors from express/body-parser/serve-static (malformed JSON, body too large, missing upload, ...).
  else if (err.status >= 400 && err.status < 500) status = err.status;
  // Missing required fields, failed CHECKs, and Postgres "data exception" errors (bad date, bad number, ...).
  else if (err instanceof ValidationError || err instanceof ConstraintViolationException || err.code?.startsWith?.("22"))
    status = 400;

  if (status === 500) console.error(err);
  // `expose: false` marks a message that isn't safe to show (e.g. serve-static's ENOENT includes the file path).
  const message = status === 500 || err.expose === false ? STATUS_CODES[status] : String(err.message);
  // First line only: MikroORM appends an entity dump / SQL detail on the following lines.
  res.status(status).json({ error: message?.split("\n")[0] });
};

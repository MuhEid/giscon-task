import type { IProject } from "../../entities/Project.js";
import { HttpError } from "../../common/http.js";

// Dates may arrive as "YYYY-MM-DD" strings or Date objects depending on the driver mapping.
export const toDay = (value: unknown): string | null =>
  value == null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

interface Dated {
  startDate?: unknown;
  endDate?: unknown;
  project: Pick<IProject, "startDate" | "endDate">;
}

// The period a staff member actually worked on a project: their own dates where set, otherwise the
// project's. Kept inside the project's dates, in case the project was shortened after the assignment was saved.
// A null end date means ongoing.
export function assignmentPeriod({ startDate, endDate, project }: Dated) {
  const projectStart = toDay(project.startDate)!;
  const projectEnd = toDay(project.endDate);
  let start = toDay(startDate) ?? projectStart;
  let end = toDay(endDate) ?? projectEnd;
  if (start < projectStart) start = projectStart;
  if (projectEnd && (!end || end > projectEnd)) end = projectEnd;
  return { startDate: start, endDate: end };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Reads optional startDate/endDate from a request body ("" or null = same as the project).
// Only keys that are present are returned, so PUT stays a partial update.
export function pickDates(body: unknown): { startDate?: string | null; endDate?: string | null } {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: { startDate?: string | null; endDate?: string | null } = {};
  for (const key of ["startDate", "endDate"] as const) {
    if (!(key in source)) continue;
    const value = source[key];
    if (value == null || value === "") out[key] = null;
    else if (typeof value === "string" && DAY.test(value)) out[key] = value;
    else throw new HttpError(400, `${key} must be a date (YYYY-MM-DD)`);
  }
  return out;
}

// Rejects a period that falls outside the project's dates or ends before it starts.
export function checkPeriod({ startDate, endDate, project }: Dated) {
  const start = toDay(startDate);
  const end = toDay(endDate);
  const projectStart = toDay(project.startDate)!;
  const projectEnd = toDay(project.endDate);
  if (start && start < projectStart) throw new HttpError(400, `Start date can't be before the project starts (${projectStart})`);
  if (start && projectEnd && start > projectEnd) throw new HttpError(400, `Start date can't be after the project ends (${projectEnd})`);
  if (end && end < projectStart) throw new HttpError(400, `End date can't be before the project starts (${projectStart})`);
  if (end && projectEnd && end > projectEnd) throw new HttpError(400, `End date can't be after the project ends (${projectEnd})`);
  if (end && end < (start ?? projectStart)) throw new HttpError(400, "End date can't be before the start date");
}

// Newest first by the staff member's own start date.
export const byPeriodDesc = (a: Dated, b: Dated) =>
  assignmentPeriod(b).startDate.localeCompare(assignmentPeriod(a).startDate);

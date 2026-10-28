import path from "node:path";
import { fileURLToPath } from "node:url";
import nunjucks from "nunjucks";

// Template ids double as the options of the template dropdown in the UI.
export const TEMPLATES = ["with-photo", "no-photo"] as const;
export type TemplateId = (typeof TEMPLATES)[number];

export const TEMPLATES_DIR =
  process.env.TEMPLATES_DIR ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../templates");

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(TEMPLATES_DIR, { noCache: process.env.NODE_ENV !== "production" }),
  { autoescape: true, throwOnUndefined: false },
);

env.addFilter("date", (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Present",
);

export class TemplateNotFoundError extends Error {
  constructor(id: string) {
    super(`CV template "${id}" not found`);
  }
}

export function isTemplateId(id: string): id is TemplateId {
  return (TEMPLATES as readonly string[]).includes(id);
}

export function renderHtml(templateId: string, data: object): string {
  if (!isTemplateId(templateId)) throw new TemplateNotFoundError(templateId);
  return env.render(`${templateId}.njk`, data);
}

import { readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nunjucks from "nunjucks";
import { SAMPLE_CV } from "./sample.js";

// Templates are the *.njk files in this directory; the file name (without extension) is the template id
// and doubles as the option in the UI dropdown. Adding, editing or removing a file changes the list.
export const TEMPLATES_DIR =
  process.env.TEMPLATES_DIR ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../templates");

// Templates can be edited at runtime, so never serve a cached compiled version.
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(TEMPLATES_DIR, { noCache: true }), {
  autoescape: true,
  throwOnUndefined: false,
});

env.addFilter("date", (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Present",
);

// `status` is picked up by the HTTP error handler.
export class TemplateNotFoundError extends Error {
  status = 404;
  constructor(id: string) {
    super(`CV template "${id}" not found`);
  }
}

export class TemplateError extends Error {
  status = 400;
}

// Lower-case words joined by hyphens, e.g. "two-column". Also keeps ids from escaping TEMPLATES_DIR.
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidTemplateId = (id: string) => ID_PATTERN.test(id);

function fileOf(id: string) {
  if (!isValidTemplateId(id)) throw new TemplateNotFoundError(id);
  return path.join(TEMPLATES_DIR, `${id}.njk`);
}

export async function listTemplates(): Promise<string[]> {
  const files = await readdir(TEMPLATES_DIR);
  return files
    .filter((f) => f.endsWith(".njk"))
    .map((f) => f.slice(0, -".njk".length))
    .filter(isValidTemplateId)
    .sort();
}

export async function templateExists(id: string) {
  return isValidTemplateId(id) && (await listTemplates()).includes(id);
}

export async function readTemplate(id: string): Promise<string> {
  try {
    return await readFile(fileOf(id), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") throw new TemplateNotFoundError(id);
    throw err;
  }
}

// Renders template source that isn't (necessarily) saved yet; used for the editor preview and for validation.
export function renderTemplateSource(content: string, data: object): string {
  try {
    return env.renderString(content, data);
  } catch (err) {
    // Nunjucks spreads the location and the reason over several lines; keep both on one.
    // The "(unknown path)" prefix is noise: the source being rendered isn't a file.
    const message = String((err as Error).message)
      .replace(/\s*\n\s*/g, " ")
      .replace(/^\(unknown path\)\s*/, "")
      .trim();
    throw new TemplateError(`Template error: ${message}`);
  }
}

// Saves a template after checking it renders with sample data, so a broken template never reaches users.
// Writes to a temporary file first, so a CV rendered mid-save never sees a half-written template.
export async function writeTemplate(id: string, content: string) {
  renderTemplateSource(content, { cv: SAMPLE_CV });
  const file = fileOf(id);
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, file);
}

export async function deleteTemplate(id: string) {
  await rm(fileOf(id));
}

export function renderHtml(templateId: string, data: object): string {
  return env.render(path.basename(fileOf(templateId)), data);
}

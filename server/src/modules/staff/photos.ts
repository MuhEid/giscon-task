import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HttpError } from "../../common/http.js";

// Uploaded files live outside the source tree (a Docker volume in production); the DB stores
// paths relative to this directory, so the directory can move without a data migration.
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../uploads");

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Allowed image types, recognised by their leading bytes rather than the client's Content-Type or
// file name, so nothing but a real JPEG/PNG/WebP is ever stored (no SVG/HTML that could run script).
const FORMATS = [
  { ext: "jpg", mime: "image/jpeg", matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from("\x89PNG\r\n\x1a\n", "latin1")) },
  { ext: "webp", mime: "image/webp", matches: (b: Buffer) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" },
];

const formatOf = (relativePath: string) => FORMATS.find((f) => relativePath.endsWith(`.${f.ext}`));

// Resolves a stored path, refusing anything that would point outside UPLOADS_DIR.
function absolute(relativePath: string) {
  const file = path.resolve(UPLOADS_DIR, relativePath);
  if (!file.startsWith(UPLOADS_DIR + path.sep)) throw new Error(`Invalid upload path: ${relativePath}`);
  return file;
}

// Saves the image under a random name and returns its path relative to UPLOADS_DIR.
export async function savePhoto(data: unknown): Promise<string> {
  if (!Buffer.isBuffer(data) || data.length === 0) {
    throw new HttpError(400, "Send the image file as the request body (JPEG, PNG or WebP)");
  }
  const format = FORMATS.find((f) => f.matches(data));
  if (!format) throw new HttpError(400, "Photo must be a JPEG, PNG or WebP image");

  const relativePath = `photos/${randomUUID()}.${format.ext}`;
  await mkdir(path.dirname(absolute(relativePath)), { recursive: true });
  await writeFile(absolute(relativePath), data);
  return relativePath;
}

// Best effort: a missing file shouldn't block clearing the DB reference.
export async function removePhoto(relativePath: string | null | undefined) {
  if (relativePath) await rm(absolute(relativePath), { force: true });
}

// The photo as a data: URI, so CV HTML is self-contained (Puppeteer renders it with no base URL).
export async function photoDataUri(relativePath: string | null | undefined): Promise<string | undefined> {
  const format = relativePath && formatOf(relativePath);
  if (!format) return undefined;
  try {
    const data = await readFile(absolute(relativePath));
    return `data:${format.mime};base64,${data.toString("base64")}`;
  } catch {
    // A file lost from disk leaves the CV without a photo rather than failing it.
    return undefined;
  }
}

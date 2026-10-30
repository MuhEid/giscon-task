import { Router, type Request } from "express";
import type { EntityManager } from "@mikro-orm/postgresql";
import { HttpError, parseId } from "../../common/http.js";
import { listTemplates, renderHtml } from "../../pdf/templates.js";
import { htmlToPdf } from "../../pdf/pdf.js";
import type { CvData } from "../../pdf/types.js";
import { buildCv } from "./cv.service.js";

type CvParams = { staffId: string };

async function parseTemplate(value: unknown): Promise<string> {
  const id = String(value ?? "");
  const templates = await listTemplates();
  if (!templates.includes(id)) throw new HttpError(400, `template must be one of: ${templates.join(", ")}`);
  return id;
}

// `?exclude=3,7` (or `?exclude=3&exclude=7`) leaves those projects off this CV only;
// the assignments themselves are untouched.
function parseExclude(value: unknown): number[] {
  const parts = String(value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const ids = parts.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new HttpError(400, "exclude must be a comma-separated list of project ids");
  }
  return ids;
}

// File-name-safe version of the staff member's name, e.g. "Jane O'Neil" -> "Jane-ONeil".
const fileName = (name: string) =>
  `${name.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-") || "cv"}-CV.pdf`;

// Mounted at /api/cv; serves the CV data, HTML preview and PDF for a staff member.
export function cvRouter(em: EntityManager) {
  const router = Router();

  async function loadCv(req: Request<CvParams>): Promise<{ template: string; cv: CvData }> {
    const template = await parseTemplate(req.query.template);
    const exclude = parseExclude(req.query.exclude);
    return { template, cv: await buildCv(em, parseId(req.params.staffId), exclude) };
  }

  // The exact payload fed into the templates; handy for debugging and tests.
  router.get("/:staffId", async (req: Request<CvParams>, res) => {
    res.json((await loadCv(req)).cv);
  });

  router.get("/:staffId/preview", async (req: Request<CvParams>, res) => {
    const { template, cv } = await loadCv(req);
    res.type("html").send(renderHtml(template, { cv }));
  });

  router.get("/:staffId/pdf", async (req: Request<CvParams>, res) => {
    const { template, cv } = await loadCv(req);
    const pdf = await htmlToPdf(renderHtml(template, { cv }));
    // `?download=1` saves the file; otherwise the browser shows it inline.
    const disposition = req.query.download ? "attachment" : "inline";
    res
      .type("pdf")
      .setHeader("Content-Disposition", `${disposition}; filename="${fileName(cv.name)}"`)
      .send(Buffer.from(pdf));
  });

  return router;
}

import { Router } from "express";
import type { EntityManager } from "@mikro-orm/postgresql";
import { HttpError, parseId } from "../../common/http.js";
import {
  deleteTemplate,
  isValidTemplateId,
  listTemplates,
  readTemplate,
  renderTemplateSource,
  templateExists,
  writeTemplate,
} from "../../pdf/templates.js";
import { SAMPLE_CV } from "../../pdf/sample.js";
import { buildCv } from "../cv/cv.service.js";

function contentOf(body: unknown): string {
  const content = (body as { content?: unknown } | undefined)?.content;
  if (typeof content !== "string" || !content.trim()) throw new HttpError(400, "content is required");
  return content;
}

// Mounted at /api/templates. Templates are files, so edits apply to the next CV rendered.
// Note: Nunjucks templates are not sandboxed; anyone who can edit them can run code on the server.
export function templatesRouter(em: EntityManager) {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await listTemplates());
  });

  // Renders unsaved template source for the editor preview, with a staff member's data or sample data.
  router.post("/preview", async (req, res) => {
    const content = contentOf(req.body);
    const staffId = req.body.staffId;
    const cv = staffId == null || staffId === "" ? SAMPLE_CV : await buildCv(em, parseId(String(staffId)));
    res.json({ html: renderTemplateSource(content, { cv }) });
  });

  router.get("/:id", async (req, res) => {
    res.json({ id: req.params.id, content: await readTemplate(req.params.id) });
  });

  router.post("/", async (req, res) => {
    const id = String(req.body?.id ?? "");
    if (!isValidTemplateId(id)) {
      throw new HttpError(400, "id must be lower-case letters and digits separated by hyphens, e.g. two-column");
    }
    if (await templateExists(id)) throw new HttpError(409, `Template "${id}" already exists`);
    const content = contentOf(req.body);
    await writeTemplate(id, content);
    res.status(201).json({ id, content });
  });

  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    await readTemplate(id); // 404 for an unknown template; PUT doesn't create
    const content = contentOf(req.body);
    await writeTemplate(id, content);
    res.json({ id, content });
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await readTemplate(id);
    if ((await listTemplates()).length === 1) throw new HttpError(409, "The last template can't be deleted");
    await deleteTemplate(id);
    res.status(204).end();
  });

  return router;
}

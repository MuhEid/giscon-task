import { Router } from "express";
import type { EntityManager, RequiredEntityData } from "@mikro-orm/postgresql";
import { Project, type IProject } from "../../entities/Project.js";
import { parseId, pick } from "../../common/http.js";

const FIELDS = [
  "name",
  "description",
  "client",
  "location",
  "sector",
  "startDate",
  "endDate",
  "technologies",
] as const;

export function projectsRouter(em: EntityManager) {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await em.findAll(Project, { orderBy: { startDate: "desc" } }));
  });

  router.get("/:id", async (req, res) => {
    const project = await em.findOneOrFail(Project, parseId(req.params.id), { populate: ["assignments.staff"] });
    res.json(project);
  });

  router.post("/", async (req, res) => {
    const project = em.create(Project, pick(req.body, FIELDS) as RequiredEntityData<IProject>);
    await em.flush();
    res.status(201).json(project);
  });

  router.put("/:id", async (req, res) => {
    const project = await em.findOneOrFail(Project, parseId(req.params.id));
    em.assign(project, pick(req.body, FIELDS));
    await em.flush();
    res.json(project);
  });

  router.delete("/:id", async (req, res) => {
    const project = await em.findOneOrFail(Project, parseId(req.params.id));
    await em.remove(project).flush();
    res.status(204).end();
  });

  return router;
}

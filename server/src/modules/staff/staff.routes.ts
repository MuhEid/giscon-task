import { Router } from "express";
import type { EntityManager, RequiredEntityData } from "@mikro-orm/postgresql";
import { Staff, type IStaff } from "../../entities/Staff.js";
import { parseId, pick } from "../../common/http.js";

const FIELDS = ["name", "jobTitle", "yearsOfExperience", "summary", "skills", "email", "phone", "photoUrl"] as const;

export function staffRouter(em: EntityManager) {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await em.findAll(Staff, { orderBy: { name: "asc" } }));
  });

  router.get("/:id", async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id), { populate: ["assignments.project"] });
    res.json(staff);
  });

  router.post("/", async (req, res) => {
    const staff = em.create(Staff, pick(req.body, FIELDS) as RequiredEntityData<IStaff>);
    await em.flush();
    res.status(201).json(staff);
  });

  router.put("/:id", async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id));
    em.assign(staff, pick(req.body, FIELDS));
    await em.flush();
    res.json(staff);
  });

  router.delete("/:id", async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id));
    await em.remove(staff).flush();
    res.status(204).end();
  });

  return router;
}

import express, { Router } from "express";
import type { EntityManager, RequiredEntityData } from "@mikro-orm/postgresql";
import { Staff, type IStaff } from "../../entities/Staff.js";
import { HttpError, parseId, pick } from "../../common/http.js";
import { MAX_PHOTO_BYTES, removePhoto, savePhoto } from "./photos.js";

const FIELDS = ["name", "jobTitle", "yearsOfExperience", "summary", "skills", "email", "phone"] as const;

// Phone is required on create and can't be cleared on update (the DB enforces it too; this gives a clear message).
function checkPhone(body: Record<string, unknown>, creating: boolean) {
  if (!creating && !("phone" in body)) return;
  if (typeof body.phone !== "string" || !body.phone.trim()) throw new HttpError(400, "Phone is required");
  body.phone = body.phone.trim();
}

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
    const data = pick(req.body, FIELDS);
    checkPhone(data, true);
    const staff = em.create(Staff, data as RequiredEntityData<IStaff>);
    await em.flush();
    res.status(201).json(staff);
  });

  router.put("/:id", async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id));
    const data = pick(req.body, FIELDS);
    checkPhone(data, false);
    em.assign(staff, data);
    await em.flush();
    res.json(staff);
  });

  router.delete("/:id", async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id));
    await em.remove(staff).flush();
    await removePhoto(staff.photoPath);
    res.status(204).end();
  });

  // The request body is the image file itself (Content-Type image/*), e.g. `fetch(url, { method: "PUT", body: file })`.
  router.put("/:id/photo", express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }), async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id));
    const previous = staff.photoPath;
    staff.photoPath = await savePhoto(req.body);
    try {
      await em.flush();
    } catch (err) {
      await removePhoto(staff.photoPath);
      throw err;
    }
    await removePhoto(previous);
    res.json(staff);
  });

  router.delete("/:id/photo", async (req, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.id));
    const previous = staff.photoPath;
    staff.photoPath = null;
    await em.flush();
    await removePhoto(previous);
    res.json(staff);
  });

  return router;
}

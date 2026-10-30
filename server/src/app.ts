import express from "express";
import cors from "cors";
import { RequestContext } from "@mikro-orm/core";
import type { MikroORM } from "@mikro-orm/postgresql";
import { errorHandler } from "./common/http.js";
import { staffRouter } from "./modules/staff/staff.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { assignmentsRouter } from "./modules/assignments/assignments.routes.js";
import { cvRouter } from "./modules/cv/cv.routes.js";
import { templatesRouter } from "./modules/templates/templates.routes.js";
import { UPLOADS_DIR } from "./modules/staff/photos.js";

export function createApp(orm: MikroORM) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  // Gives each request its own identity map; `orm.em` below resolves to that per-request fork.
  app.use((_req, _res, next) => RequestContext.create(orm.em, next));

  app.get("/api/health", async (_req, res) => {
    const { ok } = await orm.checkConnection();
    res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", app: "CV Generator", db: ok });
  });

  // Uploaded files (staff photos), referenced by the paths stored in the DB.
  app.use("/api/uploads", express.static(UPLOADS_DIR, { fallthrough: false, index: false }));
  app.use("/api/staff/:staffId/assignments", assignmentsRouter(orm.em));
  app.use("/api/staff", staffRouter(orm.em));
  app.use("/api/projects", projectsRouter(orm.em));
  app.use("/api/templates", templatesRouter(orm.em));
  app.use("/api/cv", cvRouter(orm.em));

  app.use(errorHandler);

  return app;
}

import express from "express";
import cors from "cors";
import { RequestContext } from "@mikro-orm/core";
import type { MikroORM } from "@mikro-orm/postgresql";

export function createApp(orm: MikroORM) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use((_req, _res, next) => RequestContext.create(orm.em, next));

  app.get("/api/health", async (_req, res) => {
    const { ok } = await orm.checkConnection();
    res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", app: "CV Generator", db: ok });
  });

  return app;
}

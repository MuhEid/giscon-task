import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { Staff, Project, ProjectAssignment } from "./entities/index.js";

export default defineConfig({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  dbName: process.env.DB_NAME || "cv_generator",
  entities: [Staff, Project, ProjectAssignment],
  extensions: [Migrator],
  migrations: {
    path: "dist/migrations",
    pathTs: "src/migrations",
  },
  debug: process.env.NODE_ENV !== "production",
});

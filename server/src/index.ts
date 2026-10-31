import { createApp } from "./app.js";
import { initORM } from "./db.js";
import { seedDemoData } from "./seed/seed.js";

const PORT = Number(process.env.PORT) || 5000;

const orm = await initORM();
// Demo mode (on in docker-compose.yml): fill an empty database so the app is usable straight away.
if (process.env.SEED_DEMO_DATA === "true" && (await seedDemoData(orm.em.fork()))) {
  console.log("Seeded demo staff, projects and assignments.");
}
const app = createApp(orm);

app.listen(PORT, () => {
  console.log(`CV Generator server running on http://localhost:${PORT}`);
});

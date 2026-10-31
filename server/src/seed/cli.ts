// `npm run seed` (or `node dist/seed/cli.js` in the container): adds the demo data to an empty database.
import { initORM } from "../db.js";
import { closeBrowser } from "../pdf/pdf.js";
import { seedDemoData } from "./seed.js";

const orm = await initORM();
try {
  const seeded = await seedDemoData(orm.em.fork());
  console.log(seeded ? "Demo data added." : "Database already has staff or projects; nothing seeded.");
} finally {
  await orm.close();
  await closeBrowser();
}

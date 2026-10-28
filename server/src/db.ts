import { MikroORM } from "@mikro-orm/postgresql";
import config from "./mikro-orm.config.js";

export async function initORM() {
  const orm = await MikroORM.init(config);
  // Bring the schema up to date on every start so `docker compose up` needs no manual step.
  await orm.migrator.up();
  return orm;
}

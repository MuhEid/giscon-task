import { MikroORM } from "@mikro-orm/postgresql";
import config from "./mikro-orm.config.js";

export async function initORM() {
  const orm = await MikroORM.init(config);
  await orm.connect();
  return orm;
}

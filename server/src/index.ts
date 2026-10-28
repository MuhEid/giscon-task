import { createApp } from "./app.js";
import { initORM } from "./db.js";

const PORT = Number(process.env.PORT) || 5000;

const orm = await initORM();
const app = createApp(orm);

app.listen(PORT, () => {
  console.log(`CV Generator server running on http://localhost:${PORT}`);
});

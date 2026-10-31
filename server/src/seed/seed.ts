import type { EntityManager } from "@mikro-orm/postgresql";
import { Staff } from "../entities/Staff.js";
import { Project, type IProject } from "../entities/Project.js";
import { ProjectAssignment } from "../entities/ProjectAssignment.js";
import { htmlToPng } from "../pdf/pdf.js";
import { savePhoto } from "../modules/staff/photos.js";
import { DEMO_PROJECTS, DEMO_STAFF } from "./demo-data.js";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// A coloured square with the person's initials, so the photo templates have something to show.
async function avatar(name: string, color: string): Promise<string | null> {
  const html = `<body style="margin:0;width:256px;height:256px;display:flex;align-items:center;justify-content:center;
    background:${color};color:#fff;font:600 104px Arial, sans-serif">${initials(name)}</body>`;
  try {
    return await savePhoto(Buffer.from(await htmlToPng(html, 256, 256)));
  } catch (err) {
    // No Chromium available (e.g. local dev without `npx puppeteer browsers install chrome`): seed without photos.
    console.warn(`[seed] Skipping photo for ${name}: ${(err as Error).message.split("\n")[0]}`);
    return null;
  }
}

// Adds the demo staff, projects and assignments, but only to an empty database so real data is never touched.
// Returns whether anything was seeded.
export async function seedDemoData(em: EntityManager): Promise<boolean> {
  if ((await em.count(Staff)) > 0 || (await em.count(Project)) > 0) return false;

  const projects = Object.fromEntries(
    Object.entries(DEMO_PROJECTS).map(([key, data]) => [
      key,
      em.create(Project, { ...data, technologies: [...data.technologies] }),
    ]),
  ) as Record<keyof typeof DEMO_PROJECTS, IProject>;

  for (const { assignments, avatarColor, ...data } of DEMO_STAFF) {
    const staff = em.create(Staff, { ...data, photoPath: await avatar(data.name, avatarColor) });
    for (const { project, ...assignment } of assignments) {
      em.create(ProjectAssignment, { ...assignment, staff, project: projects[project] });
    }
  }

  await em.flush();
  return true;
}

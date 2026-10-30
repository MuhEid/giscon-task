import type { EntityManager } from "@mikro-orm/postgresql";
import { Staff } from "../../entities/Staff.js";
import { ProjectAssignment } from "../../entities/ProjectAssignment.js";
import type { CvData } from "../../pdf/types.js";
import { photoDataUri } from "../staff/photos.js";
import { toCvData } from "./cv.mapper.js";

// Loads a staff member's CV data, newest project first, leaving out the `exclude`d project ids.
export async function buildCv(em: EntityManager, staffId: number, exclude: number[] = []): Promise<CvData> {
  const staff = await em.findOneOrFail(Staff, staffId);
  const assignments = await em.find(
    ProjectAssignment,
    { staff, ...(exclude.length && { project: { $nin: exclude } }) },
    { populate: ["project"], orderBy: { project: { startDate: "desc" } } },
  );
  return toCvData(staff, assignments, await photoDataUri(staff.photoPath));
}

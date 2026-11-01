import type { EntityManager } from "@mikro-orm/postgresql";
import { Staff } from "../../entities/Staff.js";
import { ProjectAssignment } from "../../entities/ProjectAssignment.js";
import type { CvData } from "../../pdf/types.js";
import { photoDataUri } from "../staff/photos.js";
import { toCvData } from "./cv.mapper.js";
import { byPeriodDesc } from "../assignments/period.js";

// Loads a staff member's CV data, newest first by their own start date on each project, leaving out the `exclude`d project ids.
export async function buildCv(em: EntityManager, staffId: number, exclude: number[] = []): Promise<CvData> {
  const staff = await em.findOneOrFail(Staff, staffId);
  const assignments = await em.find(
    ProjectAssignment,
    { staff, ...(exclude.length && { project: { $nin: exclude } }) },
    { populate: ["project"] },
  );
  return toCvData(staff, assignments.sort(byPeriodDesc), await photoDataUri(staff.photoPath));
}

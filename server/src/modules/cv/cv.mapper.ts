import type { IStaff } from "../../entities/Staff.js";
import type { IProjectAssignment } from "../../entities/ProjectAssignment.js";
import type { CvData, CvProject } from "../../pdf/types.js";

// Dates may arrive as "YYYY-MM-DD" strings or Date objects depending on the driver mapping.
const toDateString = (value: unknown) =>
  value == null ? undefined : value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

export function toCvProject({ project, role, responsibilities }: IProjectAssignment): CvProject {
  return {
    name: project.name,
    client: project.client,
    location: project.location,
    sector: project.sector ?? undefined,
    description: project.description,
    startDate: toDateString(project.startDate),
    endDate: toDateString(project.endDate),
    technologies: project.technologies ?? [],
    role,
    responsibilities: responsibilities ?? undefined,
  };
}

// Builds the template payload. `assignments` must have `project` populated and already be
// filtered (excluded projects removed) and ordered as they should appear on the CV.
// `photoUrl` is the photo as something the template can load (a data: URI), since the DB only holds a file path.
export function toCvData(staff: IStaff, assignments: IProjectAssignment[], photoUrl?: string): CvData {
  return {
    name: staff.name,
    jobTitle: staff.jobTitle,
    yearsOfExperience: staff.yearsOfExperience,
    summary: staff.summary,
    email: staff.email ?? undefined,
    phone: staff.phone ?? undefined,
    photoUrl,
    skills: staff.skills ?? [],
    projects: assignments.map(toCvProject),
  };
}

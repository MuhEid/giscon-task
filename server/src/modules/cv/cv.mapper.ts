import type { IStaff } from "../../entities/Staff.js";
import type { IProjectAssignment } from "../../entities/ProjectAssignment.js";
import type { CvData, CvProject } from "../../pdf/types.js";
import { assignmentPeriod } from "../assignments/period.js";

export function toCvProject(assignment: IProjectAssignment): CvProject {
  const { project, role, responsibilities } = assignment;
  // The staff member's own period on the project, which may be shorter than the project itself.
  const { startDate, endDate } = assignmentPeriod(assignment);
  return {
    name: project.name,
    client: project.client,
    location: project.location,
    sector: project.sector ?? undefined,
    description: project.description,
    startDate,
    endDate: endDate ?? undefined,
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
    phone: staff.phone,
    photoUrl,
    skills: staff.skills ?? [],
    projects: assignments.map(toCvProject),
  };
}

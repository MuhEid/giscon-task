import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { Staff } from "./Staff.js";
import { Project } from "./Project.js";

// Pivot of the Staff <-> Project many-to-many relation, carrying the staff member's
// participation details. The composite key allows one role per staff member per project.
export const ProjectAssignment = defineEntity({
  name: "ProjectAssignment",
  properties: {
    staff: () => p.manyToOne(Staff).primary().deleteRule("cascade"),
    project: () => p.manyToOne(Project).primary().deleteRule("cascade"),
    role: p.string(),
    responsibilities: p.text().nullable(),
    // The staff member's own period on the project. Null means "same as the project" (for endDate: until
    // the project ends, or ongoing). The routes keep the effective period inside the project's dates.
    startDate: p.date().nullable(),
    endDate: p.date().nullable().check("end_date is null or start_date is null or end_date >= start_date"),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
});

export type IProjectAssignment = InferEntity<typeof ProjectAssignment>;

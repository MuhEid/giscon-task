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
    createdAt: p.datetime().onCreate(() => new Date()),
  },
});

export type IProjectAssignment = InferEntity<typeof ProjectAssignment>;

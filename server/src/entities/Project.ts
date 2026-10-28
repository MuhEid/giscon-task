import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { Staff } from "./Staff.js";
import { ProjectAssignment } from "./ProjectAssignment.js";

export const Project = defineEntity({
  name: "Project",
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    description: p.text(),
    client: p.string(),
    location: p.string(),
    // e.g. "Government", "Utilities", "Healthcare" — useful when picking relevant projects for a tender.
    sector: p.string().nullable(),
    // Duration is stored as a date range; a null end date means the project is ongoing.
    startDate: p.date(),
    endDate: p.date().nullable().check("end_date is null or end_date >= start_date"),
    // Technologies are free-text tags stored as a Postgres text[] column.
    technologies: p.array().default([]),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
    assignments: () => p.oneToMany(ProjectAssignment).mappedBy("project"),
    staff: () => p.manyToMany(Staff).mappedBy("projects"),
  },
});

export type IProject = InferEntity<typeof Project>;

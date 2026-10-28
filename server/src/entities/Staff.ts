import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { Project } from "./Project.js";
import { ProjectAssignment } from "./ProjectAssignment.js";

export const Staff = defineEntity({
  name: "Staff",
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    jobTitle: p.string(),
    yearsOfExperience: p.integer().check("years_of_experience >= 0"),
    summary: p.text(),
    // Skills are free-text tags stored as a Postgres text[] column.
    skills: p.array().default([]),
    email: p.string().nullable().unique(),
    phone: p.string().nullable(),
    photoUrl: p.string().nullable(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
    // Participation (role, responsibilities) lives on ProjectAssignment, so create links
    // through `assignments`; `projects` is a read-side shortcut over the same pivot table.
    assignments: () => p.oneToMany(ProjectAssignment).mappedBy("staff"),
    projects: () => p.manyToMany(Project).pivotEntity(() => ProjectAssignment).owner(),
  },
});

export type IStaff = InferEntity<typeof Staff>;

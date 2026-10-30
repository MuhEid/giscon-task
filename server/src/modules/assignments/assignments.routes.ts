import { Router, type Request } from "express";
import type { EntityManager, RequiredEntityData } from "@mikro-orm/postgresql";
import { Staff } from "../../entities/Staff.js";
import { Project } from "../../entities/Project.js";
import { ProjectAssignment, type IProjectAssignment } from "../../entities/ProjectAssignment.js";
import { HttpError, parseId, pick } from "../../common/http.js";

const FIELDS = ["role", "responsibilities"] as const;

type StaffParams = { staffId: string };
type AssignmentParams = StaffParams & { projectId: string };

// Mounted at /api/staff/:staffId/assignments; an assignment is identified by its project id.
export function assignmentsRouter(em: EntityManager) {
  const router = Router({ mergeParams: true });

  const find = ({ staffId, projectId }: AssignmentParams) =>
    em.findOneOrFail(ProjectAssignment, { staff: parseId(staffId), project: parseId(projectId) });

  router.get("/", async (req: Request<StaffParams>, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.staffId));
    const assignments = await em.find(
      ProjectAssignment,
      { staff },
      { populate: ["project"], orderBy: { project: { startDate: "desc" } } },
    );
    res.json(assignments);
  });

  router.post("/", async (req: Request<StaffParams>, res) => {
    const staff = await em.findOneOrFail(Staff, parseId(req.params.staffId));
    if (req.body?.projectId == null) throw new HttpError(400, "projectId is required");
    const project = await em.findOneOrFail(Project, parseId(String(req.body.projectId)));
    if (await em.count(ProjectAssignment, { staff, project })) {
      throw new HttpError(409, `${staff.name} is already assigned to ${project.name}`);
    }
    const data = { ...pick(req.body, FIELDS), staff, project } as RequiredEntityData<IProjectAssignment>;
    const assignment = em.create(ProjectAssignment, data);
    await em.flush();
    res.status(201).json(assignment);
  });

  router.put("/:projectId", async (req: Request<AssignmentParams>, res) => {
    const assignment = await find(req.params);
    em.assign(assignment, pick(req.body, FIELDS));
    await em.flush();
    res.json(assignment);
  });

  router.delete("/:projectId", async (req: Request<AssignmentParams>, res) => {
    const assignment = await find(req.params);
    await em.remove(assignment).flush();
    res.status(204).end();
  });

  return router;
}

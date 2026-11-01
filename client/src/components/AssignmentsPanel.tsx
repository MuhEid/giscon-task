import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router'
import { api, assignmentPeriod, formatDate, orNull, type Assignment } from '../api'
import { useList } from '../useList'

// Blank dates mean "same as the project".
const empty = { projectId: '', role: '', responsibilities: '', startDate: '', endDate: '' }

interface Props {
  staffId: number
  staffName: string
}

export default function AssignmentsPanel({ staffId, staffName }: Props) {
  const {
    items: assignments,
    error: loadError,
    reload,
  } = useList(() => api.assignments.list(staffId), [staffId])
  const { items: projects } = useList(api.projects.list)
  // When set, the form edits that project's assignment instead of adding a new one.
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value })

  const assignedIds = new Set(assignments.map((a) => a.project.id))
  const available = projects.filter((p) => !assignedIds.has(p.id))
  // The project picked in the form, to limit the date inputs to its period.
  const project =
    assignments.find((a) => a.project.id === editingProjectId)?.project ??
    projects.find((p) => p.id === Number(form.projectId))

  function startEdit(a: Assignment) {
    setEditingProjectId(a.project.id)
    setForm({
      projectId: String(a.project.id),
      role: a.role,
      responsibilities: a.responsibilities ?? '',
      startDate: a.startDate ?? '',
      endDate: a.endDate ?? '',
    })
    setError(null)
  }

  function reset() {
    setEditingProjectId(null)
    setForm(empty)
    setError(null)
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    const data = {
      role: form.role,
      responsibilities: orNull(form.responsibilities),
      startDate: orNull(form.startDate),
      endDate: orNull(form.endDate),
    }
    try {
      if (editingProjectId) await api.assignments.update(staffId, editingProjectId, data)
      else await api.assignments.create(staffId, Number(form.projectId), data)
      reset()
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(a: Assignment) {
    if (!confirm(`Remove ${staffName} from "${a.project.name}"?`)) return
    try {
      await api.assignments.remove(staffId, a.project.id)
      if (editingProjectId === a.project.id) reset()
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section className="card">
      <h2>Project experience</h2>
      {loadError && <p className="error">{loadError}</p>}

      <ul className="assignments">
        {assignments.map((a) => (
          <li key={a.project.id} className={a.project.id === editingProjectId ? 'selected' : undefined}>
            <div className="assignment-head">
              <strong>{a.project.name}</strong>
              <span className="muted">{assignmentPeriod(a)}</span>
            </div>
            <div>{a.role}</div>
            {a.responsibilities && <p className="muted">{a.responsibilities}</p>}
            <div className="actions">
              <button onClick={() => startEdit(a)}>Edit</button>
              <button className="danger" onClick={() => remove(a)}>
                Remove
              </button>
            </div>
          </li>
        ))}
        {assignments.length === 0 && <li className="muted">Not assigned to any project yet.</li>}
      </ul>

      <form onSubmit={submit}>
        <h3>{editingProjectId ? 'Edit assignment' : 'Add to project'}</h3>
        <label>
          Project
          <select required disabled={!!editingProjectId} value={form.projectId} onChange={set('projectId')}>
            {editingProjectId ? (
              <option value={editingProjectId}>
                {assignments.find((a) => a.project.id === editingProjectId)?.project.name}
              </option>
            ) : (
              <>
                <option value="">Select a project…</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.client})
                  </option>
                ))}
              </>
            )}
          </select>
        </label>
        <label>
          Role
          <input required value={form.role} onChange={set('role')} placeholder="e.g. Tech Lead" />
        </label>
        <div className="row">
          <label>
            From
            <input
              type="date"
              value={form.startDate}
              onChange={set('startDate')}
              min={project?.startDate}
              max={form.endDate || project?.endDate || undefined}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={form.endDate}
              onChange={set('endDate')}
              min={form.startDate || project?.startDate}
              max={project?.endDate ?? undefined}
            />
          </label>
        </div>
        <p className="muted hint">
          {project
            ? `Project runs ${formatDate(project.startDate)} – ${formatDate(project.endDate)}. `
            : ''}
          Leave a date blank to use the project's.
        </p>
        <label>
          Responsibilities / contributions
          <textarea rows={3} value={form.responsibilities} onChange={set('responsibilities')} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" className="primary">
            {editingProjectId ? 'Save assignment' : 'Add assignment'}
          </button>
          {editingProjectId && (
            <button type="button" onClick={reset}>
              Cancel
            </button>
          )}
          <Link className="button" to={`/cv?staff=${staffId}`}>
            Generate CV
          </Link>
        </div>
      </form>
    </section>
  )
}

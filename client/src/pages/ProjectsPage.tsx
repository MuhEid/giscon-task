import { useState, type SubmitEvent } from 'react'
import { api, formatDate, orNull, toList, type Project } from '../api'
import { useList } from '../useList'

const empty = {
  name: '',
  description: '',
  client: '',
  location: '',
  sector: '',
  startDate: '',
  endDate: '',
  technologies: '',
}

type Form = typeof empty

const toForm = (p: Project): Form => ({
  name: p.name,
  description: p.description,
  client: p.client,
  location: p.location,
  startDate: p.startDate,
  sector: p.sector ?? '',
  endDate: p.endDate ?? '',
  technologies: p.technologies.join(', '),
})

export default function ProjectsPage() {
  const { items: projects, error: loadError, reload } = useList(api.projects.list)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(empty)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof Form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value })

  function startEdit(p: Project) {
    setEditingId(p.id)
    setForm(toForm(p))
    setError(null)
  }

  function reset() {
    setEditingId(null)
    setForm(empty)
    setError(null)
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    const data = {
      ...form,
      sector: orNull(form.sector),
      endDate: orNull(form.endDate),
      technologies: toList(form.technologies),
    }
    try {
      if (editingId) await api.projects.update(editingId, data)
      else await api.projects.create(data)
      reset()
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(p: Project) {
    if (!confirm(`Delete project "${p.name}"?`)) return
    try {
      await api.projects.remove(p.id)
      if (editingId === p.id) reset()
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="crud">
      <section>
        <h1>Projects</h1>
        {loadError && <p className="error">{loadError}</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Client</th>
              <th>Duration</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className={p.id === editingId ? 'selected' : undefined}>
                <td>{p.name}</td>
                <td>{p.client}</td>
                <td>
                  {formatDate(p.startDate)} – {formatDate(p.endDate)}
                </td>
                <td className="actions">
                  <button onClick={() => startEdit(p)}>Edit</button>
                  <button className="danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <form className="card" onSubmit={submit}>
        <h2>{editingId ? 'Edit project' : 'New project'}</h2>
        <label>
          Name
          <input required value={form.name} onChange={set('name')} />
        </label>
        <label>
          Client
          <input required value={form.client} onChange={set('client')} />
        </label>
        <div className="row">
          <label>
            Location
            <input required value={form.location} onChange={set('location')} />
          </label>
          <label>
            Sector
            <input value={form.sector} onChange={set('sector')} placeholder="Optional" />
          </label>
        </div>
        <div className="row">
          <label>
            Start date
            <input type="date" required value={form.startDate} onChange={set('startDate')} />
          </label>
          <label>
            End date
            <input type="date" value={form.endDate} onChange={set('endDate')} />
            <small>Leave empty if ongoing</small>
          </label>
        </div>
        <label>
          Technologies
          <input value={form.technologies} onChange={set('technologies')} placeholder="React, PostGIS, Node.js" />
        </label>
        <label>
          Description
          <textarea required rows={5} value={form.description} onChange={set('description')} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" className="primary">
            {editingId ? 'Save changes' : 'Create project'}
          </button>
          {editingId && (
            <button type="button" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

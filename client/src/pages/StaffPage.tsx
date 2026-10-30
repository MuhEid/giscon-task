import { useState, type SubmitEvent } from 'react'
import { api, orNull, photoSrc, toList, type Staff } from '../api'
import { useList } from '../useList'
import AssignmentsPanel from '../components/AssignmentsPanel'

const empty = {
  name: '',
  jobTitle: '',
  yearsOfExperience: '',
  summary: '',
  skills: '',
  email: '',
  phone: '',
}

type Form = typeof empty

const toForm = (s: Staff): Form => ({
  name: s.name,
  jobTitle: s.jobTitle,
  yearsOfExperience: String(s.yearsOfExperience),
  summary: s.summary,
  skills: s.skills.join(', '),
  email: s.email ?? '',
  phone: s.phone ?? '',
})

export default function StaffPage() {
  const { items: staff, error: loadError, reload } = useList(api.staff.list)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(empty)
  // The saved photo, and a newly picked file that is uploaded on save (so it works for new staff too).
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof Form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value })

  function startEdit(s: Staff) {
    setEditingId(s.id)
    setForm(toForm(s))
    setPhotoPath(s.photoPath)
    setPhotoFile(null)
    setError(null)
  }

  function reset() {
    setEditingId(null)
    setForm(empty)
    setPhotoPath(null)
    setPhotoFile(null)
    setError(null)
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    const data = {
      ...form,
      yearsOfExperience: Number(form.yearsOfExperience),
      skills: toList(form.skills),
      email: orNull(form.email),
      phone: orNull(form.phone),
    }
    try {
      // Stay on the saved record so its project assignments can be managed right away.
      let saved = editingId ? await api.staff.update(editingId, data) : await api.staff.create(data)
      setEditingId(saved.id)
      if (photoFile) saved = await api.staff.uploadPhoto(saved.id, photoFile)
      startEdit(saved)
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function removePhoto() {
    if (!editingId || !confirm('Remove this photo?')) return
    try {
      await api.staff.removePhoto(editingId)
      setPhotoPath(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(s: Staff) {
    if (!confirm(`Delete ${s.name}? Their project assignments will be deleted too.`)) return
    try {
      await api.staff.remove(s.id)
      if (editingId === s.id) reset()
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="crud">
      <section>
        <h1>Staff</h1>
        {loadError && <p className="error">{loadError}</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Job title</th>
              <th>Experience</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className={s.id === editingId ? 'selected' : undefined}>
                <td>{s.name}</td>
                <td>{s.jobTitle}</td>
                <td>{s.yearsOfExperience} yrs</td>
                <td className="actions">
                  <button onClick={() => startEdit(s)}>Edit</button>
                  <button className="danger" onClick={() => remove(s)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="side">
        <form className="card" onSubmit={submit}>
          <h2>{editingId ? 'Edit staff member' : 'New staff member'}</h2>
          <label>
            Name
            <input required value={form.name} onChange={set('name')} />
          </label>
          <div className="row">
            <label>
              Job title
              <input required value={form.jobTitle} onChange={set('jobTitle')} />
            </label>
            <label>
              Years of experience
              <input
                type="number"
                min={0}
                required
                value={form.yearsOfExperience}
                onChange={set('yearsOfExperience')}
              />
            </label>
          </div>
          <div className="row">
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} placeholder="Optional" />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={set('phone')} placeholder="Optional" />
            </label>
          </div>
          <label>
            Photo <small>Optional · JPEG, PNG or WebP, up to 5 MB</small>
            {photoPath && (
              <span className="photo">
                <img src={photoSrc(photoPath)} alt="" />
                <button type="button" className="danger" onClick={removePhoto}>
                  Remove photo
                </button>
              </span>
            )}
            <input
              // Remount after save/reset to clear the chosen file.
              key={`${editingId}-${photoPath}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Skills
            <input value={form.skills} onChange={set('skills')} placeholder="TypeScript, PostGIS, Team leadership" />
          </label>
          <label>
            Summary
            <textarea required rows={5} value={form.summary} onChange={set('summary')} />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button type="submit" className="primary">
              {editingId ? 'Save changes' : 'Create staff member'}
            </button>
            {editingId && (
              <button type="button" onClick={reset}>
                Close
              </button>
            )}
          </div>
        </form>

        {editingId && (
          <AssignmentsPanel key={editingId} staffId={editingId} staffName={form.name} />
        )}
      </div>
    </div>
  )
}

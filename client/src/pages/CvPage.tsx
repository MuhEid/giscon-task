import { useRef, useState } from 'react'
import { api, formatDate, templateLabel } from '../api'
import { useList } from '../useList'

export default function CvPage() {
  const { items: staff, error: staffError } = useList(api.staff.list)
  const { items: templates } = useList(api.templates.list)
  const [staffId, setStaffId] = useState<number | null>(null)
  const [chosenTemplate, setTemplate] = useState('')
  const template = chosenTemplate || templates[0] || ''
  // Projects left off the generated CV; reset whenever another staff member is picked.
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  // URLs of the CV currently shown; set by "Generate CV" so the preview and the download always match.
  const [generated, setGenerated] = useState<{ preview: string; pdf: string } | null>(null)
  const frame = useRef<HTMLIFrameElement>(null)

  const { items: assignments, error: assignmentsError } = useList(
    () => (staffId ? api.assignments.list(staffId) : Promise.resolve([])),
    [staffId],
  )

  function selectStaff(value: string) {
    setStaffId(value ? Number(value) : null)
    setExcluded(new Set())
    setGenerated(null)
  }

  function toggle(projectId: number) {
    const next = new Set(excluded)
    if (next.has(projectId)) next.delete(projectId)
    else next.add(projectId)
    setExcluded(next)
  }

  function generate() {
    if (!staffId || !template) return
    const exclude = [...excluded]
    setGenerated({
      preview: api.cvUrl(staffId, 'preview', template, exclude),
      pdf: api.cvUrl(staffId, 'pdf', template, exclude),
    })
  }

  return (
    <div className="crud cv">
      <div className="side">
        <section className="card">
          <h2>Generate CV</h2>
          {staffError && <p className="error">{staffError}</p>}
          <label>
            Staff member
            <select value={staffId ?? ''} onChange={(e) => selectStaff(e.target.value)}>
              <option value="">Select a staff member…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.jobTitle})
                </option>
              ))}
            </select>
          </label>
          <label>
            Template
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {templates.map((t) => (
                <option key={t} value={t}>
                  {templateLabel(t)}
                </option>
              ))}
            </select>
          </label>

          {staffId && (
            <>
              <h3>Project experience</h3>
              <p className="muted hint">Untick a project to leave it off this CV. It stays in the database.</p>
              {assignmentsError && <p className="error">{assignmentsError}</p>}
              <ul className="assignments">
                {assignments.map((a) => (
                  <li key={a.project.id} className={excluded.has(a.project.id) ? 'excluded' : undefined}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={!excluded.has(a.project.id)}
                        onChange={() => toggle(a.project.id)}
                      />
                      <span>
                        <strong>{a.project.name}</strong> · {a.role}
                        <br />
                        <span className="muted">
                          {formatDate(a.project.startDate)} – {formatDate(a.project.endDate)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
                {assignments.length === 0 && <li className="muted">Not assigned to any project yet.</li>}
              </ul>
            </>
          )}

          <div className="actions">
            <button className="primary" disabled={!staffId || !template} onClick={generate}>
              Generate CV
            </button>
          </div>
        </section>
      </div>

      <section className="card preview">
        {generated ? (
          <>
            <div className="actions">
              <a className="button" href={`${generated.pdf}&download=1`}>
                Download PDF
              </a>
              <button onClick={() => frame.current?.contentWindow?.print()}>Print</button>
            </div>
            <iframe ref={frame} title="CV preview" src={generated.preview} />
          </>
        ) : (
          <p className="muted">Pick a staff member and a template, then click “Generate CV” to preview it here.</p>
        )}
      </section>
    </div>
  )
}

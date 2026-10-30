import { useEffect, useState } from 'react'
import { api, templateLabel } from '../api'
import { useList } from '../useList'

export default function TemplatesPage() {
  const { items: templates, error: listError, reload } = useList(api.templates.list)
  const { items: staff } = useList(api.staff.list)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const current = selectedId ?? templates[0] ?? null
  // `saved` is the content on the server; the editor is "dirty" while `content` differs from it.
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const dirty = content !== saved
  // Preview with a staff member's data, or the server's sample CV when null.
  const [previewStaffId, setPreviewStaffId] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!current) return
    let stale = false
    api.templates
      .get(current)
      .then((t) => {
        if (stale) return
        setContent(t.content)
        setSaved(t.content)
      })
      .catch((e: Error) => !stale && setError(e.message))
    return () => {
      stale = true
    }
  }, [current])

  // Live preview of the unsaved source, refreshed shortly after typing stops.
  useEffect(() => {
    if (!content) return
    let stale = false
    const timer = setTimeout(() => {
      api.templates
        .preview(content, previewStaffId)
        .then(({ html }) => {
          if (stale) return
          setPreviewHtml(html)
          setPreviewError(null)
        })
        .catch((e: Error) => !stale && setPreviewError(e.message))
    }, 500)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [content, previewStaffId])

  function select(id: string) {
    if (dirty && !confirm('Discard your unsaved changes?')) return
    setSelectedId(id)
    setError(null)
    setNotice(null)
  }

  async function save() {
    if (!current) return
    try {
      await api.templates.save(current, content)
      setSaved(content)
      setError(null)
      setNotice(`Saved. New CVs use the updated "${templateLabel(current)}" template.`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function createCopy() {
    const id = prompt('Name for the new template (lower-case words separated by hyphens, e.g. two-column):')
    if (!id) return
    try {
      // Starts as a copy of what's in the editor, so an existing layout can be adapted.
      await api.templates.create(id.trim(), content)
      setSaved(content)
      setSelectedId(id.trim())
      setError(null)
      setNotice(`Created "${templateLabel(id.trim())}".`)
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove() {
    if (!current || !confirm(`Delete the "${templateLabel(current)}" template? This can't be undone.`)) return
    try {
      await api.templates.remove(current)
      setSelectedId(templates.find((t) => t !== current) ?? null)
      setError(null)
      setNotice(`Deleted "${templateLabel(current)}".`)
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="templates">
      <section className="card editor">
        <div className="toolbar">
          <select value={current ?? ''} onChange={(e) => select(e.target.value)}>
            {templates.map((t) => (
              <option key={t} value={t}>
                {templateLabel(t)}
              </option>
            ))}
          </select>
          <button className="primary" disabled={!dirty} onClick={save}>
            Save
          </button>
          <button disabled={!dirty} onClick={() => setContent(saved)}>
            Revert
          </button>
          <button onClick={createCopy}>Save as new…</button>
          <button className="danger" disabled={templates.length < 2} onClick={remove}>
            Delete
          </button>
        </div>
        <p className="muted hint">
          Nunjucks HTML. The CV is available as <code>cv</code> (name, jobTitle, yearsOfExperience, summary, email,
          phone, photoUrl, skills, projects). A template that fails to render can't be saved.
        </p>
        {listError && <p className="error">{listError}</p>}
        {error && <p className="error">{error}</p>}
        {notice && !error && <p className="notice">{notice}</p>}
        <textarea
          className="code"
          spellCheck={false}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setNotice(null)
          }}
        />
      </section>

      <section className="card preview">
        <label>
          Preview with
          <select
            value={previewStaffId ?? ''}
            onChange={(e) => setPreviewStaffId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sample data</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {previewError && <p className="error">{previewError}</p>}
        {/* sandbox: the preview is display-only, so scripts in a template never run in the app. */}
        <iframe title="Template preview" sandbox="" srcDoc={previewHtml} />
      </section>
    </div>
  )
}

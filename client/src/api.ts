export interface Staff {
  id: number
  name: string
  jobTitle: string
  yearsOfExperience: number
  summary: string
  skills: string[]
  email: string | null
  phone: string | null
  // Relative to /api/uploads; changed only through api.staff.uploadPhoto/removePhoto.
  photoPath: string | null
}

export interface Project {
  id: number
  name: string
  description: string
  client: string
  location: string
  sector: string | null
  startDate: string
  endDate: string | null
  technologies: string[]
}

export interface Assignment {
  project: Project
  role: string
  responsibilities: string | null
}

// A CV template: a Nunjucks HTML file on the server, identified by its file name.
export interface Template {
  id: string
  content: string
}

export type StaffInput = Omit<Staff, 'id' | 'photoPath'>
export type ProjectInput = Omit<Project, 'id'>
export type AssignmentInput = Omit<Assignment, 'project'>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

function crud<T, TInput>(path: string) {
  return {
    list: () => request<T[]>(path),
    get: (id: number) => request<T>(`${path}/${id}`),
    create: (data: TInput) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: TInput) =>
      request<T>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`${path}/${id}`, { method: 'DELETE' }),
  }
}

export const api = {
  staff: {
    ...crud<Staff, StaffInput>('/staff'),
    // The file itself is the request body; the server stores it and saves its path on the staff member.
    uploadPhoto: (id: number, file: File) =>
      request<Staff>(`/staff/${id}/photo`, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } }),
    removePhoto: (id: number) => request<Staff>(`/staff/${id}/photo`, { method: 'DELETE' }),
  },
  projects: crud<Project, ProjectInput>('/projects'),
  // A staff member's project assignments, identified by project id.
  assignments: {
    list: (staffId: number) => request<Assignment[]>(`/staff/${staffId}/assignments`),
    create: (staffId: number, projectId: number, data: AssignmentInput) =>
      request<Assignment>(`/staff/${staffId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ ...data, projectId }),
      }),
    update: (staffId: number, projectId: number, data: AssignmentInput) =>
      request<Assignment>(`/staff/${staffId}/assignments/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (staffId: number, projectId: number) =>
      request<void>(`/staff/${staffId}/assignments/${projectId}`, { method: 'DELETE' }),
  },
  templates: {
    list: () => request<string[]>('/templates'),
    get: (id: string) => request<Template>(`/templates/${id}`),
    create: (id: string, content: string) =>
      request<Template>('/templates', { method: 'POST', body: JSON.stringify({ id, content }) }),
    save: (id: string, content: string) =>
      request<Template>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    remove: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
    // Renders unsaved template source with a staff member's data, or sample data when staffId is null.
    preview: (content: string, staffId: number | null) =>
      request<{ html: string }>('/templates/preview', {
        method: 'POST',
        body: JSON.stringify({ content, staffId }),
      }),
  },
  // CV URLs are loaded directly by an iframe / link rather than fetched as JSON.
  // `exclude` leaves those projects off this CV only; the assignments are not changed.
  cvUrl: (staffId: number, kind: 'preview' | 'pdf', template: string, exclude: number[]) => {
    const params = new URLSearchParams({ template })
    if (exclude.length) params.set('exclude', exclude.join(','))
    return `/api/cv/${staffId}/${kind}?${params}`
  },
}

// Tag lists are edited as comma-separated text.
export const toList = (text: string) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

// "two-column-with-photo" -> "Two column with photo"
export const templateLabel = (id: string) => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

export const photoSrc = (photoPath: string) => `/api/uploads/${photoPath}`

export const orNull = (text: string) => text.trim() || null

export const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'

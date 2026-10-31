# giscon-task
GISCON Technical Evaluation Task — **CV Generator**: an internal tool for storing staff and project data and generating professional CVs from predefined templates.

## Setup

### Option 1: Docker (recommended)

Requires Docker with Compose.

```bash
docker compose up --build
```

| What | Where |
|---|---|
| App | http://localhost:8080 |
| API | http://localhost:5000/api (health check: `/api/health`) |
| PostgreSQL | `localhost:5432`, user/password `postgres`, database `cv_generator` |

On first start the server applies the database migrations and, because the database is empty, adds demo data (4 staff, 8 projects, 15 assignments), so you can go straight to **Generate CV**.

Data is kept in three volumes: `db-data` (database), `uploads` (staff photos) and `templates` (CV templates, including edits made in the UI). To start over with a fresh demo, delete them all (**this erases all data, photos and template edits**):

```bash
docker compose down -v
docker compose up --build
```

### Option 2: Local development

Requires Node.js 24 and npm, plus Docker for the database (or your own PostgreSQL 17).

```bash
# 1. Database
docker compose up -d db

# 2. Server (http://localhost:5000, restarts on change)
cd server
npm install
npx puppeteer browsers install chrome   # optional, see below
npm run dev
npm run seed                            # optional, in another terminal: demo data for an empty database

# 3. Client (http://localhost:5173, forwards /api to the server)
cd client
npm install
npm run dev
```

The Chrome download is **optional**. The server uses it only for **Download PDF** and for the demo avatars. Without it, CVs can still be generated, previewed and printed (including your browser's "Save as PDF"); Download PDF reports that Chromium isn't installed, and the seed adds staff without photos. If you already have Chrome or Chromium, set `PUPPETEER_EXECUTABLE_PATH` to it instead of downloading. The Docker image includes Chromium, so none of this applies there.

### Configuration

The server reads these environment variables. The defaults match the Docker database, so local development needs none of them. `server/.env.example` lists the database ones; the server doesn't load `.env` files itself, so export the variables in your shell or pass them on the command line.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `5432`, `postgres`, `postgres`, `cv_generator` | PostgreSQL connection |
| `SEED_DEMO_DATA` | off (`true` in `docker-compose.yml`) | Add demo data on start when the database is empty |
| `UPLOADS_DIR` | `server/uploads` | Where staff photos are stored |
| `TEMPLATES_DIR` | `server/templates` | Where CV templates are read from and saved to |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer's own Chrome | Chromium used to render PDFs |

### Other commands

| Command (in `server/`) | Does |
|---|---|
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled server |
| `npm run migration:create` | Generate a migration from entity changes |
| `npm run migration:up` / `migration:down` | Apply / roll back migrations (also applied automatically on start) |

In `client/`: `npm run build` (typecheck and production build) and `npm run lint` (oxlint).

## Assumptions

### Data model
- **Staff ↔ Project is many-to-many.** A staff member can work on many projects and a project can have many staff members. The link table `project_assignment` is a full entity (not a bare join table) because it carries the staff member's **role** and **responsibilities/contributions** on that project.
- **One role per staff member per project.** The assignment's primary key is `(staff_id, project_id)`; if someone changed roles during a project, the role text should describe it (e.g. "Developer, later Tech Lead").
- **A staff member's participation period equals the project's duration.** Assignments have no dates of their own; the CV shows the project's start/end dates.
- **"Experience" means total years of professional experience**, stored as a whole number (`years_of_experience >= 0`), entered manually rather than computed from projects (staff have experience from before joining GISCON).
- **Project "duration" is stored as a date range** (`start_date`, optional `end_date`) rather than a free-text length. A missing end date means the project is ongoing and is shown as "Present". The database enforces `end_date >= start_date`.
- **Skills and technologies are free-text tags** stored as PostgreSQL `text[]` columns rather than separate lookup tables. They are only ever displayed, never queried across staff/projects, so normalising them would add tables and joins with no benefit. They can be migrated to `skill`/`technology` tables later if filtering ("all staff who know React") becomes a requirement.
- **Name, job title, experience and summary are required** for staff, since every CV template needs them. Contact details (email, phone) and the photo are optional; email is unique when present.
- **Project name, description, client, location and start date are required**, matching the "project details" listed in the brief. `sector` is an optional extra used to help pick relevant projects for a tender.
- **Photos are uploaded files stored on the server's disk**, not in the database. The DB holds only the path relative to the uploads directory (`UPLOADS_DIR`, default `server/uploads`), so the directory can move without a data migration. Files get random names; replacing or removing a photo, or deleting the staff member, deletes the old file. Only JPEG, PNG and WebP up to 5 MB are accepted. In CVs the photo is embedded in the HTML as a data URI, so the preview and the PDF need no access to the uploads URL.
- **Deleting a staff member or a project deletes their assignments** (`on delete cascade`); the other side is kept.
- **Single language.** All content is stored and rendered in one language (English).

### Application
- **No authentication or authorisation.** This is an internal tool assumed to run on a trusted network. User roles are not part of the brief; a roles middleware could be added later.
- **`PUT` is a partial update**: only the fields sent are changed. Unknown fields and `id`/timestamps in request bodies are ignored.
- **Skills and technologies are entered as comma-separated text** in the UI (e.g. `React, PostGIS`) and split into a list before saving; a skill name therefore can't contain a comma.
- **Templates are files, editable in the UI.** Each `*.njk` file in the templates directory is a template; the user picks one from a dropdown when generating a CV and can edit, copy or delete templates on the Templates page. Edits apply to the next CV generated. Files were chosen over database rows to keep templates easy to version and edit by hand.
- **Templates are self-contained.** Each template is one complete HTML file (no shared partials), so editing one in the UI never changes another; the "with photo" variants duplicate their layout's markup on purpose.
- **Demo data is seeded only into an empty database** (no staff and no projects), so it never mixes with or overwrites real data. Seeded people, clients and projects are fictional. Avatars are generated images of the person's initials; they're skipped if Chromium isn't available.
- **Template editing is trusted.** Nunjucks is not sandboxed, so anyone who can edit a template can run code on the server. That's acceptable only because the tool has no users/roles and runs on a trusted network (see above); template editing is the first thing to restrict if access control is added.
- **In Docker, UI template edits live on a volume**, which Docker fills from the image only when it is first created. Later changes to `server/templates/` in the repo don't reach an existing volume; reset it with `docker compose rm -sf server && docker volume rm giscon-task_templates && docker compose up -d server` (this discards UI edits).
- **Excluding a project from a CV is per generation, not saved.** The exclusion list travels in the CV request (`?exclude=`), so it never changes the staff member's assignments and nothing has to be reset afterwards. Projects on a CV are listed newest first.
- **The schema is managed only by migrations**, which run automatically when the server starts.

## Data model

```
staff 1 ──< project_assignment >── 1 project
            (staff_id, project_id) PK
            role, responsibilities
```

| Table | Columns |
|---|---|
| `staff` | `id`, `name`, `job_title`, `years_of_experience`, `summary`, `skills text[]`, `email` (unique, optional), `phone` (optional), `photo_path` (optional, relative to the uploads directory), `created_at`, `updated_at` |
| `project` | `id`, `name`, `description`, `client`, `location`, `sector` (optional), `start_date`, `end_date` (optional), `technologies text[]`, `created_at`, `updated_at` |
| `project_assignment` | `staff_id` → `staff`, `project_id` → `project` (composite PK, both `on delete cascade`), `role`, `responsibilities` (optional), `created_at` |

## Key design decisions

### Architecture
- **React single-page app + Express REST API + PostgreSQL**, as required by the brief. The client calls the API on the same origin under `/api` (nginx in Docker, the Vite dev server locally), so there are no cross-origin issues and the CV preview, PDF links and photos all use plain relative URLs.
- **Server code is organised by feature** (`server/src/modules/staff`, `projects`, `assignments`, `cv`, `templates`), each with its own router. Errors are handled in one place (`common/http.ts`), which maps "not found", duplicates and invalid input to 404/409/400 responses, so route handlers stay short.
- **MikroORM with migrations.** Entities are defined once with `defineEntity` and their TypeScript types are inferred from them. The schema changes only through migrations, which run automatically when the server starts, so `docker compose up` needs no manual database step.

### Data model
- **The staff ↔ project link is its own entity** (`ProjectAssignment`), because the brief's "role" and "responsibilities" belong to a person *on a project*, not to either side alone.
- **Skills and technologies are PostgreSQL arrays**, not lookup tables: they are only displayed, never searched across records (see [Assumptions](#assumptions)).

### CV generation
- **One HTML rendering serves the preview, printing and the PDF.** The pipeline is: database → `buildCv` → `CvData` (via the mapper) → Nunjucks template → HTML. The browser preview shows that HTML, Print prints it, and the PDF is the same HTML printed by headless Chromium (Puppeteer). What you see is exactly what you export, and templates are written in HTML/CSS, which anyone on a web team can edit.
- **Templates never see the database.** The mapper turns entities into a plain `CvData` object, so schema changes don't break templates and templates can't reach internal fields.
- **Chromium is started once and shared** across PDF requests; each request only opens a new page, so exports are fast after the first.
- **Print-proof templates.** Page margins are part of the page content rather than printer settings, and background colours are forced to print, so CVs look the same whatever the browser's print dialog is set to. On screen, the same templates show an A4 sheet.
- **Excluding projects is part of the CV URL** (`?exclude=3,7`), not stored state. Generating a CV never changes the data, and a CV with exclusions is just a link.

### Templates
- **Templates are files, and the folder is the list.** Every `*.njk` file in `server/templates/` is a template, named after the file. This meets "templates may evolve over time": adding a template means adding a file, and existing ones can be edited in the app's Templates page with a live preview. A template is only saved if it renders correctly, so a broken template never reaches users.
- **Nunjucks** was chosen for its familiar Jinja-style syntax, automatic HTML escaping of data, and support for any HTML/CSS layout. The four shipped templates cover two genuinely different structures (single column, and two columns with a sidebar), each with and without a photo.

### Photos
- **Photos are files on disk with their path in the database**, keeping binary data out of PostgreSQL. Uploads are checked by their actual file content (JPEG/PNG/WebP only), stored under random names, and cleaned up when replaced or deleted. CVs embed the photo directly in the HTML, so the PDF renderer doesn't need to fetch it.

### Delivery
- **Docker Compose runs everything** (database, API with Chromium, nginx serving the client), with volumes for the database, photos and templates. An empty database is filled with fictional demo data on first start, so a reviewer can generate a CV immediately.
- **The client has no UI framework**: plain React, one typed API module (`client/src/api.ts`), a small data-loading hook (`useList`) and a single hand-written stylesheet. That is enough for an internal tool with four screens and keeps the dependency list short.

## APIs

All endpoints are under `/api` and exchange JSON unless noted. Errors return `{ "error": "<message>" }` with status 400 (invalid input), 404 (not found), 409 (conflict, e.g. a duplicate), 413 (upload too large) or 503 (PDF export unavailable).

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server and database status |

### Staff
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/staff` | List staff, by name |
| `GET` | `/api/staff/:id` | One staff member, with their assignments and projects |
| `POST` | `/api/staff` | Create: `name`, `jobTitle`, `yearsOfExperience`, `summary`; optional `skills` (array), `email`, `phone` |
| `PUT` | `/api/staff/:id` | Update the fields sent (partial update) |
| `DELETE` | `/api/staff/:id` | Delete, with their assignments and photo |
| `PUT` | `/api/staff/:id/photo` | Upload or replace the photo. The body is the image file itself (`Content-Type: image/jpeg`, `image/png` or `image/webp`, up to 5 MB) |
| `DELETE` | `/api/staff/:id/photo` | Remove the photo |
| `GET` | `/api/uploads/:path` | Serve an uploaded file, using the staff member's `photoPath` |

### Projects
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/projects` | List projects, newest first |
| `GET` | `/api/projects/:id` | One project, with its assigned staff |
| `POST` | `/api/projects` | Create: `name`, `description`, `client`, `location`, `startDate`; optional `technologies` (array), `sector`, `endDate` (empty = ongoing) |
| `PUT` | `/api/projects/:id` | Update the fields sent (partial update) |
| `DELETE` | `/api/projects/:id` | Delete, with its assignments |

### Assignments (a staff member's project experience)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/staff/:staffId/assignments` | The staff member's assignments with their projects, newest first |
| `POST` | `/api/staff/:staffId/assignments` | Assign to a project: `projectId`, `role`; optional `responsibilities`. 409 if already assigned |
| `PUT` | `/api/staff/:staffId/assignments/:projectId` | Update `role` / `responsibilities` |
| `DELETE` | `/api/staff/:staffId/assignments/:projectId` | Remove the staff member from the project |

### Templates
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/templates` | List template ids, e.g. `["one-column", "two-column", …]` |
| `GET` | `/api/templates/:id` | Template source: `{ id, content }` |
| `POST` | `/api/templates` | Create: `id` (lower-case words joined by hyphens), `content`. 409 if it exists |
| `PUT` | `/api/templates/:id` | Save new `content`. Refused (400) if the template doesn't render |
| `DELETE` | `/api/templates/:id` | Delete. The last template can't be deleted (409) |
| `POST` | `/api/templates/preview` | Render unsaved `content` with a staff member's data (`staffId`) or sample data (no `staffId`). Returns `{ html }` |

### CV generation
All three take `template=<id>` (required) and `exclude=<projectId>,<projectId>` (optional: projects left off this CV only; nothing is changed in the database).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/cv/:staffId/preview` | The CV as HTML, for viewing and printing in the browser |
| `GET` | `/api/cv/:staffId/pdf` | The CV as an A4 PDF, shown in the browser; add `download=1` to save it as `<Name>-CV.pdf` |
| `GET` | `/api/cv/:staffId` | The data passed to the template, as JSON (useful when writing templates) |

Example: `GET /api/cv/1/pdf?template=two-column-with-photo&exclude=3,7&download=1`

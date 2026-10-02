# PyPath — Python Learning Platform

PyPath is a modular learning platform starter built with React, Vite, TypeScript, Express, Prisma, and PostgreSQL. Frontend and backend live in separate `frontend/` and `backend/` folders, with independent package manifests and separate Vercel projects. The root package coordinates local development. The production database can be Neon PostgreSQL; no database URL or other secret is bundled in the frontend.

The current foundation includes the responsive public site, layered backend, cookie-based registration/login, role-protected student/admin routes, server-side admin authorization, paginated learning APIs, and the complete learning-platform Prisma data model. Python submissions are stored but never executed by the API.

## Technology and structure

```text
.
├── frontend/
│   ├── package.json            # React/Vite app and frontend dependencies
│   ├── vercel.json             # Frontend Vercel project configuration
│   ├── src/
│   │   ├── components/         # Shared navigation, cards, route guards
│   │   ├── context/            # Authentication state
│   │   ├── pages/              # Home, courses, lessons, auth, dashboards
│   │   ├── services/           # Typed API service modules
│   │   └── types/
│   └── vite.config.ts
├── backend/
│   ├── api/
│   │   └── index.ts            # Vercel serverless Express function
│   ├── package.json            # Express/Prisma app and backend dependencies
│   ├── vercel.json             # Backend Vercel project configuration
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── errors/
│       ├── middleware/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       ├── app.ts
│       └── index.ts
├── .env.example
└── package.json
```

`frontend/` and `backend/` are independent npm workspaces with their own `package.json` files, source, and dependencies. Each folder is deployed as the Root Directory of its own Vercel project.

The backend follows `routes → controllers → services → repositories → Prisma`. Routes declare endpoint middleware, controllers handle HTTP input/output, services enforce business rules, and repositories contain database queries. The Prisma client is shared through `backend/src/config/database.ts`.

Run the build and backend unit tests without connecting to PostgreSQL:

```bash
npm run build
npm test --workspace backend
npx prisma validate --schema backend/prisma/schema.prisma
```

## Requirements

- Node.js 20.19+ (or 22.12+) and npm.
- A PostgreSQL database for database-backed local development. You may use a local PostgreSQL instance or a separate development Neon database; production does not require a local database.

## Local development

```bash
git clone <your-repository-url>
cd python-learning-platform
npm install
```

The frontend dependencies are declared in `frontend/package.json`, and the Express/Prisma dependencies are declared in `backend/package.json`. npm workspaces install both while preserving the code and package boundaries.

Copy `.env.example` to `.env` and set the backend variables. Create a strong, private `JWT_SECRET` (at least 32 characters). Set `DATABASE_URL` to a PostgreSQL connection string for local development. The application does not need a Neon database specifically while developing; use your local PostgreSQL database if you want to keep Neon for deployment.

Backend Prisma commands load the root `.env` automatically. For safety, point it at a development database before applying migrations or running the seed.

```dotenv
DATABASE_URL="postgresql://postgres:password@localhost:5432/pypath?schema=public"
JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
CLIENT_URL="http://localhost:5173"
PORT="5000"
NODE_ENV="development"
```

Create the schema, generate Prisma Client, optionally load sample content, and start the API and Vite together:

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run dev
```

`npm run dev` starts the frontend and backend workspaces together. The React app runs at `http://localhost:5173`; the separate Express API runs at `http://localhost:5000`. Vite proxies `/api` to the backend. `GET http://localhost:5000/api/health` should return:

```json
{"success":true,"message":"API is running"}
```

For frontend-only work, run `npm run dev:frontend` (or `npm run dev` from inside `frontend/`). For backend-only work, run `npm run dev:backend` (or `npm run dev` from inside `backend/`). The frontend can render without a database; authentication and database-backed backend endpoints require a working PostgreSQL `DATABASE_URL`.

Vite reads client-side variables from `frontend/.env`. Copy `frontend/.env.example` to `frontend/.env` to call `http://localhost:5000/api` directly; otherwise leave `VITE_API_URL` unset and Vite will proxy `/api` to the backend.

The Vite development server (`http://localhost:5173`) and preview server (`http://localhost:4173`) both proxy `/api` to the local Express API on port `5000`. Run both workspaces with `npm run dev`, or start the backend separately when using the frontend preview. If the course library is empty, confirm the database migrations have been applied and run `npm run prisma:seed` against a development database; the seed publishes the sample course.

### Development seed accounts

The seed command creates these local-only accounts:

| Role | Email | Default password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Instructor | `instructor@example.com` | `Teach123!` |
| Student | `student@example.com` | `Learn123!` |

Override the default seed passwords with `SEED_ADMIN_PASSWORD`, `SEED_INSTRUCTOR_PASSWORD`, and `SEED_STUDENT_PASSWORD` before seeding if desired. These credentials are for development only. Change them before using any shared database; never rely on them in production. The seed refuses to run when `NODE_ENV=production`. It creates a beginner course, six modules, 30 lessons, 10 exercises, five quizzes, five projects, 10 cheat sheets, five unpublished sample video records, and achievement definitions.

## Database and Prisma

Prisma schema, migrations, seed data, and Prisma dependencies all live under `backend/`. Prisma reads `DATABASE_URL` only in the backend. The frontend uses `VITE_API_URL` only to reach the HTTP API and must never receive a database URL.

```bash
npm run prisma:generate   # Generate Prisma Client; does not connect to PostgreSQL
npm run prisma:migrate    # Apply checked-in migrations to the configured database
npm run prisma:migrate:dev # Create/apply migrations during local development
npm run prisma:seed       # Load development seed content
npm run prisma:studio     # Open Prisma Studio
```

Prisma Client generation and TypeScript/Vite builds do not need a live PostgreSQL connection. Database operations do require one. Add and rotate database credentials through environment variables, not source code.

## Environment variables

Backend variables (configure in `.env` locally and in the Vercel project environment settings for deployment):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL/Neon connection string used by Prisma; server-side only |
| `JWT_SECRET` | Signing key for authentication cookies; use a random value of at least 32 characters |
| `CLIENT_URL` | Exact allowed browser origin for CORS, e.g. `https://my-python-course.vercel.app`; localhost:5173 is also allowed for development |
| `PORT` | Local Express port (defaults to `5000`; Vercel supplies its own runtime) |
| `NODE_ENV` | Set to `production` in the Vercel Production environment |
| `LOG_LEVEL` | Optional structured backend log level (`info` by default in production) |
| `API_RATE_WINDOW_MS`, `API_RATE_LIMIT` | Optional general API rate-limit window and request maximum |
| `AUTH_RATE_WINDOW_MS`, `AUTH_RATE_LIMIT` | Optional authentication rate-limit window and maximum |
| `QUIZ_RATE_WINDOW_MS`, `QUIZ_RATE_LIMIT` | Optional quiz-submission rate-limit window and maximum |

Client variable (optional locally; Vite proxies `/api` if unset):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Local API base URL, e.g. `http://localhost:5000/api`. Production uses the frontend Vercel `/api` proxy instead. |
| `VITE_TELEGRAM_ENROLL_URL` | Public HTTPS Telegram chat URL (for example `https://t.me/your_username`) opened by the course enrollment button. Set it on the frontend Vercel project. |
| `VITE_SOCIAL_INSTAGRAM_URL`, `VITE_SOCIAL_FACEBOOK_URL`, `VITE_SOCIAL_YOUTUBE_URL`, `VITE_SOCIAL_TIKTOK_URL`, `VITE_SOCIAL_TELEGRAM_URL` | Optional public HTTPS profile links shown in the home-page footer when set. Telegram falls back to `VITE_TELEGRAM_ENROLL_URL`. |

Never use `VITE_DATABASE_URL`: Vite variables are public in the browser bundle. Do not put real credentials in GitHub.

## Vercel deployment

1. Push the repository to GitHub.
2. Create a Vercel project for the API. Select the repository and set **Root Directory** to `backend`. Use **Framework Preset: Other**. Its `backend/vercel.json` builds Prisma/backend code and deploys `backend/api/index.ts` as the serverless API; it does not build the frontend.
3. Add `DATABASE_URL` (Neon connection string), `JWT_SECRET` (strong random secret), `CLIENT_URL` (the exact frontend origin, e.g. `https://my-python-course.vercel.app`), and `NODE_ENV=production` to the **backend Vercel project**. Do not add `DATABASE_URL` or `JWT_SECRET` to the frontend project.
4. Deploy the backend project and note its URL, for example `https://my-python-course-api.vercel.app`. Check `https://YOUR-API-DOMAIN.vercel.app/api/health`.
5. Create a second Vercel project from the same repository. Set **Root Directory** to `frontend` and use **Framework Preset: Other**. The `frontend/vercel.json` builds the Vite app into `dist`, proxies `/api/*` to the backend project, and rewrites other routes to `index.html`. If the backend project URL changes, update the API rewrite destination in that file.
6. In the frontend project's environment variables, set `VITE_TELEGRAM_ENROLL_URL` to your Telegram HTTPS chat link. This is a public client-side URL, not a secret.
7. Optionally set the `VITE_SOCIAL_*_URL` variables in the frontend project for your social profile links. Only valid HTTPS links are rendered.
8. Deploy the frontend project. Set the backend project's `CLIENT_URL` to the exact frontend origin (scheme + hostname, no path), then redeploy the backend so CORS permits the proxied request origin. The browser communicates with the frontend origin, so auth cookies remain first-party and Vercel handles the API proxy.
9. Apply the checked-in database migrations to Neon using `npm run prisma:migrate` with `DATABASE_URL` configured for that database. The development seed refuses to run with `NODE_ENV=production`; do not seed the production database.
10. Register/login, browse a published course, and verify that a non-admin is denied `/api/admin/*` and `/admin`.

The frontend and Express API deploy independently. The API is exported from `backend/api/index.ts`; only the backend's local development entry point calls `app.listen()`. In production the frontend calls its own `/api` path, which Vercel proxies to the backend; local development can use `VITE_API_URL`. CORS permits the frontend origin configured in the backend's `CLIENT_URL`.

The built-in rate-limit store is in-memory and therefore applies per running process/function instance. For a multi-instance production deployment that needs a strict shared quota, configure a shared Redis-compatible rate-limit store before relying on limits as a global abuse-control boundary.

## API overview

API resource responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": ..., "code": ... }`; validation errors also include field-level `errors`.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/health`, `/api/health/db` | Public |
| `POST` | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Public |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/courses`, `/api/courses/:id` | Public (published content) |
| `POST` | `/api/courses/:id/enroll` | Authenticated student |
| `POST`, `PUT`, `DELETE` | `/api/courses`, `/api/courses/:id` | Instructor/Admin |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/modules/:id`, `/api/modules` | Public read; Instructor/Admin writes |
| `GET` | `/api/lessons/:id` | Public (published content) |
| `POST`, `PUT`, `DELETE` | `/api/lessons`, `/api/lessons/:id` | Instructor/Admin |
| `GET` | `/api/exercises`, `/api/exercises/:id` | Public (published content) |
| `POST` | `/api/exercises/:id/submit` | Authenticated; stores code, does not execute it |
| `GET`, `POST` | `/api/quizzes`, `/api/quizzes/:id/attempts` | Public quiz list; authenticated attempts |
| `GET`, `POST` | `/api/progress`, `/api/progress/lesson` | Authenticated |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/youtube`, `/api/youtube/:id` | Public reads; Instructor/Admin writes |
| `GET` | `/api/certificates/verify/:code` | Public verification |
| `GET` | `/api/certificates` | Authenticated user's certificates |
| `GET` | `/api/admin/students`, `/api/admin/users`, `/api/admin/courses`, `/api/admin/analytics` | Admin only |
| `GET` | `/api/admin/courses/:id` | Admin only; full course curriculum, including drafts |

Paginated list endpoints accept `?page=1&limit=20` (maximum limit: 100). Existing array-valued `data` responses are preserved; pagination metadata is included alongside `data`. Quiz attempts remain repeatable learning attempts and are rate-limited; they are not silently made one-attempt-only.

Authentication uses a signed, HttpOnly cookie (and accepts bearer tokens for API clients). Roles are looked up from PostgreSQL on protected requests; a frontend-supplied role is never trusted. Admin authorization is enforced by Express as well as by the frontend route guard.

Admins can manage courses at `/admin/courses`: create, edit, publish, and delete courses, set an HTTP(S) thumbnail image URL with a live preview, control whether each course's Telegram enrollment button is active, then manage modules and lessons. The curriculum editor and public course page use the same ordered module structure as the seeded “Python for Everyone” course. Newly created modules get the standard module description when left blank; new lessons default to published, receive the standard lesson introduction when content is blank, and default to a 10-minute duration. These defaults can be edited, and lessons can still be saved as drafts. Thumbnail images are loaded from the supplied public URL and displayed on course cards; no files are uploaded to Vercel. Lesson forms accept supported YouTube video URLs; published lessons with a video display an embedded privacy-enhanced YouTube player.

## Storage and code execution

Do not store persistent uploads on Vercel's function filesystem. If upload support is added, use an external object-storage service and store object URLs/keys in PostgreSQL. YouTube URLs and IDs are stored as database fields; videos are embedded, not downloaded.

Student-submitted Python is never run by Express. The current API stores submissions without executing them. If code execution is added later, connect a separate isolated sandbox/container service; never run untrusted code in the Vercel API function.

## Current foundation scope

This foundation includes the layered backend, data model, authentication, permissions, course/module/lesson management, exercise/quiz/progress, YouTube and admin APIs, certificate verification, pagination, structured logging, rate limits, and the frontend integration. Dashboard visualizations, password recovery, and database-backed integration tests are still future work. Database integration tests must target an isolated test database, never production user data.

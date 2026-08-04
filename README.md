# TWP — Track Work Permit (Backend)

A B2B case-management SaaS where employer organizations track their foreign
employees' work-permit applications through a staged workflow. Built to
demonstrate full-stack engineering: authentication, role-based access control,
multi-tenant data isolation, and a workflow state machine.

> **Note:** This is a portfolio project. All data is fictional. It is an internal
> case-management tool — it does **not** integrate with any government system or
> submit real permit applications.

---

## What it does

Employer organizations manage work-permit applications for the foreign staff they
hire. An application is a "case" that moves through defined stages
(Draft → Submitted → Documents Under Review → Approved / Rejected).

Two kinds of users log in:

- **Organization staff (`org_staff`)** — create applications for their employees,
  upload documents, and track status. They see **only their own organization's data**.
- **Caseworkers (`caseworker`)** — process applications across organizations:
  review documents and advance or reject each stage.

Employees (the permit applicants) are **records**, not login users — the employer
manages everything on their behalf.

---

## Tech stack & why

| Layer            | Choice                                           | Why                                                                                          |
| ---------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Runtime          | **Node.js**                                      | Reuse existing JS/TS knowledge across the stack; heavily represented in target roles.        |
| Language         | **TypeScript**                                   | Type safety, catches bugs before runtime, now table-stakes in the job market.                |
| Framework        | **Express**                                      | Minimal, most-documented, most in-demand Node framework; simplest for learning fundamentals. |
| Database         | **MongoDB (Atlas) + Mongoose**                   | Document-shaped data fits the model; matches day-job stack; common in target listings.       |
| Auth             | **JWT + bcryptjs**                               | Stateless auth (no server-side sessions); bcryptjs avoids native-compile issues on deploy.   |
| Dev runner       | **tsx**                                          | Runs TypeScript directly with auto-restart; simpler than the older nodemon + ts-node combo.  |
| Deploy (planned) | **Vercel (frontend) + Railway/Render (backend)** | Free tiers, click-to-deploy; AWS deferred as its own chapter.                                |

**Principle behind the choices:** pick the option that is widely used, well-documented,
and adequate for the actual problem — not the newest or theoretically-fastest. Support
and fit beat novelty (e.g. `bcryptjs` over native `bcrypt`, MongoDB over Postgres,
REST over GraphQL).

---

## Architecture

The app is split by responsibility so each file has one job. This makes the code
navigable, testable, and is the expected answer to "how do you structure an Express app?"

```
src/
  config/
    env.ts          # loads + validates env vars, exports typed `env` object
    db.ts           # database connection logic
  models/
    User.ts         # Mongoose schema for users
  routes/
    auth.routes.ts  # defines URL paths, delegates to controllers
  controllers/
    auth.controller.ts  # request-handling logic (signup, login)
  middleware/       # (planned) auth verification, RBAC
  index.ts          # wires everything together
```

**Request flow (example — login):**

```
POST /api/auth/login
  → express.json() middleware parses the JSON body into req.body
  → auth.routes.ts matches the path, calls the login controller
  → controller validates input, looks up user, verifies password, signs a JWT
  → responds with the token (or an error)
  → any unhandled error is caught by the global error handler → clean 500
```

---

## API endpoints (so far)

| Method | Path               | Purpose                 | Success     | Failure                                     |
| ------ | ------------------ | ----------------------- | ----------- | ------------------------------------------- |
| GET    | `/`                | Health check            | 200         | —                                           |
| POST   | `/api/auth/signup` | Create a user           | 201         | 400 missing fields, 409 duplicate email     |
| POST   | `/api/auth/login`  | Authenticate, get a JWT | 200 + token | 400 missing fields, 401 invalid credentials |

**Planned:** `/api/auth/me`, `/api/organizations`, `/api/employees`,
`/api/applications` (with workflow transitions).

---

## Running locally

```bash
npm install
# create a .env file (see below)
npm run dev
```

**Required environment variables** (`.env`, never committed):

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/twp?retryWrites=true&w=majority
JWT_SECRET=<a long random string>
PORT=5001            # optional; defaults to 5001
```

The server fails fast at startup if `MONGO_URI` or `JWT_SECRET` is missing.

**Scripts:**

- `npm run dev` — run with auto-restart (tsx)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build

---

## Testing

Auth is covered by an automated test suite (Vitest + Supertest) with **6 tests**: valid
signup, missing fields, duplicate email, valid login, wrong password, unknown email, and a
security test asserting that unknown-email and wrong-password return an _identical_ response
(so the API can't be used to discover which emails are registered).

Tests run against an **in-memory MongoDB** (`mongodb-memory-server`) that is wiped between
every test — so they're isolated, repeatable, need no network, and never touch the real
database. The Express app is exported from `app.ts` separately from the server start in
`index.ts`, so Supertest exercises it in-memory with no open port.

```bash
npm test
```

---

## Key concepts demonstrated

- **Authentication** — password hashing (bcrypt), stateless JWT sessions.
- **Data modeling** — schema design, references, constraints, indexing.
- **REST API design** — resource-based URLs, correct HTTP methods and status codes.
- **Error handling** — layered: per-route handling + a global safety net.
- **Configuration management** — a single validated, typed config module.
- **Security** — see [`docs/SECURITY.md`](docs/SECURITY.md).
- **Engineering decisions & tradeoffs** — see [`docs/DECISIONS.md`](docs/DECISIONS.md).
- **Best-practice reference** — see [`docs/BEST_PRACTICES.md`](docs/BEST_PRACTICES.md).

---

## Scope discipline

V1 intentionally covers **one** permit type and **one** workflow. The original design
had many workflows (family members, ICT, Blue Card, 30% ruling, relocation, payslips) —
all deliberately deferred. Building one workflow end-to-end demonstrates the same
engineering (auth, RBAC, isolation, state machine) as building ten; the extra ones add
scope, not skill.

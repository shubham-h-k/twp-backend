# Backend Best Practices — Reference

A categorized reference of the engineering best practices applied (or planned) in TWP,
with the *why* for each. Organized by category so it doubles as interview prep — in an
interview, lead with the **category** (the structure), then back it with a **specific
example** from this project (the evidence).

Legend: ✅ applied · ⏳ planned

---

## 1. Security

See [`SECURITY.md`](SECURITY.md) for the full detail. Summary:

- ✅ Hash passwords with bcrypt; never store plaintext.
- ✅ Async hashing (don't block the event loop).
- ✅ Identical login response for wrong-email vs wrong-password (prevent user enumeration).
- ✅ Generic errors to client; full errors logged server-side.
- ✅ Global error handler so no stack trace ever leaks.
- ✅ `select: false` on the password field.
- ✅ Fail fast on missing config; secrets only in `.env`, never committed.
- ✅ Sign JWTs so payloads can't be tampered with.
- ⏳ Input validation (Zod), auth middleware, RBAC, data isolation, rate limiting.

**Mindset:** defense in depth — no single layer is "safe." The scariest bugs throw no
error at all (e.g. returning another org's data with a clean 200), so "it didn't crash"
never means "it's secure."

---

## 2. Error handling & resilience

- ✅ **Wrap async DB/IO operations in try/catch.** They return Promises; a plain
  try/catch around a non-awaited async call catches nothing (the error arrives after the
  block exits). `await` inside try/catch works because it pauses until the Promise settles.
- ✅ **Distinguish client errors (4xx) from server errors (5xx).** A duplicate email is
  the client's fault → 409, not a generic 500. Returning the wrong class misleads the
  frontend and hides the real cause.
- ✅ **Global error handler as a safety net.** Registered last, with 4 params
  `(err, req, res, next)` — that signature is how Express identifies it as an error
  handler. Catches anything unhandled.
- ✅ **Fail fast at startup** for missing required config, rather than failing
  mysteriously on every request later.
- ⏳ **`asyncHandler` wrapper** — once there are many controllers, wrap them to forward
  errors to the global handler with `next(err)` instead of repeating try/catch everywhere.

---

## 3. Input validation

- ✅ **Never trust the client.** Validate presence of required fields before using them.
- ✅ **Constrain values at the schema level** (`enum` on `role`) so invalid data can't be
  stored even if a check is missed — "make invalid states unrepresentable."
- ⏳ **Zod for full validation** — declare the exact expected shape (types, formats,
  lengths) once and reject anything that doesn't match, in one place, with clear errors.
  Catches missing fields, wrong types, and invalid values together.

---

## 4. Code organization / architecture

- ✅ **Separation of concerns** — routes (paths) / controllers (logic) / models (data) /
  config (env, db). Each file has one job.
- ✅ **Single responsibility** — e.g. `db.ts` connects and *throws* on failure; the caller
  decides what to do about it. A config module shouldn't decide to kill the process.
- ✅ **Thin `index.ts`** — it only wires pieces together (~30 lines), it doesn't contain
  business logic.
- **Why it matters:** navigable, testable, and it's the expected answer to
  "how do you structure an Express application?"

---

## 5. Naming & readability

- ✅ **Clear, unambiguous names.** `role: "org_staff"` (not `role1`), and renamed to avoid
  clashing with the separate `organization` reference field.
- ✅ **Destructuring** for readable field extraction (`const { email, password } = req.body`).
- ✅ **Consistent response shapes** — every endpoint returns `{ message, ... }` so the
  frontend reads `res.data.message` the same way everywhere.
- **Why:** code is read far more than written — by future-you, by interviewers reading
  your GitHub, by teammates.

---

## 6. Data modeling

- ✅ **Right types and constraints** — `unique` on email, `enum` on role, `required` where
  appropriate, `timestamps: true` for automatic `createdAt`/`updatedAt`.
- ✅ **References over duplicated strings** — `organization` stored as an `ObjectId` ref,
  not a copied name. One source of truth; rename once and everyone sees it; prevents
  phantom duplicates from typos.
- ✅ **Optional where the domain says so** — `organization` is not required, because
  caseworkers legitimately don't belong to one (MongoDB lets the field simply not exist).
- ✅ **Normalize before storing** — `lowercase` + `trim` on email so `A@B.com` and
  `a@b.com` don't become two accounts and the unique index actually works.

---

## 7. Performance & scalability

- ✅ **Index the fields you query often.** `unique: true` on email creates an index that
  both enforces uniqueness and speeds up the login lookup. Indexes speed reads, slightly
  slow writes, and cost storage — so index what you *query*, not everything.
- ✅ **Never block the event loop.** Node runs on a single main thread; a synchronous slow
  operation (e.g. `hashSync`) freezes *every* request for *every* user. Use async so the
  work goes to the thread pool / OS and the main thread stays free.
- **Know the split:** CPU-bound work (hashing) uses the limited thread pool (default 4
  workers); I/O-bound work (DB, network) doesn't and scales to thousands. Node is great
  for I/O-heavy apps (like this one), weaker for CPU-heavy work.
- ⏳ **Pagination** on list endpoints — never return thousands of records in one response.
- ⏳ **Avoid N+1 queries** — fetch related data in one query (e.g. Mongoose `populate`)
  rather than looping.

---

## 8. API design (REST)

- ✅ **Resource-based URLs (nouns), HTTP methods as verbs** —
  `GET /api/applications`, `POST /api/applications`, `GET /api/applications/:id`.
- ✅ **Correct status codes** — 201 created, 400 bad request, 401 unauthorized,
  409 conflict, 500 server error. The frontend branches on these; they're a contract,
  not decoration.
- ✅ **`/api` prefix** — separates API routes from anything else served; eases deploy routing.
- ✅ **Pragmatism over purity** — auth endpoints (`/login`, `/signup`) are verb-shaped by
  convention, and that's fine. Don't contort the design to satisfy REST purity.
- **Interview note:** REST vs GraphQL — REST is simpler and caches well; GraphQL solves
  over-fetching and multi-request assembly at the cost of complexity. The answer is the
  *tradeoff*, not "one is better."

---

## 9. Configuration management

- ✅ **One validated config module** (`env.ts`) that loads, checks, and exports a typed
  `env` object. Validated once (fail fast), typed everywhere, and a single list of what
  the app needs.
- ✅ **Export as a single object**, not loose named exports — TypeScript's type narrowing
  (from the `if (!X)` checks) survives into an object's inferred type but is *lost* across
  a bare `export { X }` (which re-exports at the original `string | undefined` type).
- ✅ **Load env before anything reads it.** Imports run first, depth-first, and top-level
  code in a module runs at *import* time. So `dotenv.config()` must run inside the
  earliest-loaded module — reading `process.env` at the top of a file imported before
  dotenv runs would read `undefined`.

---

## 10. Testing

- ⏳ **Automated tests for critical logic** — auth, RBAC, the workflow state machine.
- ⏳ **Test the failure cases**, not just the happy path — missing body → clean 400 (not a
  stack trace), duplicate email → 409, wrong password and unknown email → *identical* 401.
- **Tooling:** Jest (or Vitest) + Supertest (fires requests at the Express app without a
  running server).
- **Judgment:** test what matters (security, business logic), not trivia (a health-check
  route returning a string). Knowing *what* to test is part of the skill.

---

## 11. Version control hygiene

- ✅ **Meaningful commit messages** — each reads as a one-line changelog; the history is
  visible to recruiters on GitHub and signals deliberate work.
- ✅ **`.gitignore`** excludes `node_modules` (huge, regenerable), `dist` (build output),
  and `.env` (secrets). Commit *source*, never *generated output* or *secrets*.
- ✅ **Commit per working milestone** — a self-contained change that runs, not per line
  and not a giant half-broken dump.

---

## 12. Documentation

- ✅ **README** — what it is, how to run it, architecture, and *why* each stack choice
  was made. The first thing a recruiter reads.
- ✅ **SECURITY.md** — security decisions, worth its own file (highest stakes, best
  interview material).
- ✅ **DECISIONS.md** — notable tradeoffs and why.
- **Principle:** document *decisions and the why*, not every line. Proving choices were
  *deliberate* is what matters.

---

## 13. Logging & observability

- ✅ **Log errors server-side** (`console.error`) while returning generic messages to the
  client.
- ⏳ **Structured logging** (e.g. pino/winston) and **request logging** (e.g. morgan) —
  for a production-grade app, so logs are searchable and requests traceable.

---

## 14. Type safety

- ✅ **`strict: true`** in tsconfig — catches whole classes of bugs (e.g. the
  `string | undefined` env checks) before runtime.
- ✅ **Let types narrow** via guard checks rather than suppressing with `!`.
- ⏳ **Avoid `any`** — the one current hole is `catch (err: any)` to read `err.code`;
  the stricter pattern is `catch (err: unknown)` then narrow before use.

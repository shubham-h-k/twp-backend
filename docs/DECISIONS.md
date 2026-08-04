# Engineering Decisions & Tradeoffs

A record of notable decisions and _why_ they were made — the reasoning, the
alternatives considered, and what each choice trades off. Written as interview prep:
each entry is a short story you can tell when asked "why did you choose X?"

---

### Why MongoDB over PostgreSQL

**Chose:** MongoDB (with Mongoose).
**Because:** the data is document-shaped (an application with nested stages and
references), not heavily relational; it matches the day-job stack (so that code is a
reference); and it appears frequently in target job listings.
**Tradeoff:** Postgres is stronger for heavily relational, transaction-critical data
(e.g. a financial ledger). If TWP were that, Postgres would win. For this document-shaped,
low-join model, MongoDB fits.
**Deeper point:** the durable skill is _data modeling_ (schema design, indexing,
relationships), which transfers between both. The specific database matters far less than
understanding _why_ the data is modeled the way it is.

---

### Why bcryptjs over bcrypt

**Chose:** `bcryptjs` (pure JavaScript).
**Because:** no native compilation step, so it installs and deploys cleanly everywhere —
the native `bcrypt` compiles on install and commonly breaks on deploy (different OS/Node
version). The speed difference is irrelevant at this scale (hashing happens only on
signup/login).
**Principle:** "faster" isn't automatically "better." For this context, deployment
reliability beats raw speed.

---

### Why REST over GraphQL / tRPC

**Chose:** REST.
**Because:** it's the dominant requirement in target listings, it's the baseline everyone
understands, and this data doesn't suffer REST's weaknesses (no deep nesting / over-fetching
pain).
**Tradeoff:** GraphQL solves over-fetching and multi-request assembly, at the cost of a
schema layer, resolvers, and harder caching. tRPC gives end-to-end type safety but only
works TypeScript-to-TypeScript. Neither problem is acute here, so the added complexity
isn't worth it.
**Interview framing:** the answer to "REST vs GraphQL" is the _tradeoff_, never "one is better."

---

### Why JWT (stateless) auth

**Chose:** JWT.
**Because:** HTTP is stateless — each request arrives with no memory of the last. A signed
token carries the user's identity/role in the request itself, so the server can verify it
without a database lookup or server-side session store (which would break across multiple
server instances).
**Key property:** a JWT is _signed, not encrypted_ — the payload is readable by anyone, so
it holds only non-sensitive identifiers (userId, role, organization), never secrets. The
signature proves it wasn't tampered with.
**Tradeoff:** stateless tokens can't be easily revoked before expiry (a logout doesn't
invalidate an already-issued token). Mitigations (short expiry, refresh tokens, a denylist)
exist and are a later concern.

---

### Why write the backend by hand (not with AI)

**Chose:** write every line of application logic myself; use AI as a tutor/reviewer, not an
author.
**Because:** the durable, AI-resistant skill is _judgment_ — being able to read, debug,
defend, and architect a system, and to know when generated code is wrong. That judgment is
built by writing and understanding the code, not by prompting for it. Boilerplate/setup can
be copied; the schemas, auth, RBAC, and workflow must be understood well enough to defend
in an interview.

---

### Why a config module (`env.ts`) instead of scattered `process.env`

**Chose:** one module that loads (`dotenv.config()`), validates, and exports a typed `env`
object.
**Because:** config is validated in exactly one place (fail fast, once), typed correctly
everywhere it's used, and there's a single list of what env vars the app needs. Scattering
`process.env.X` re-validates everywhere and re-triggers the same TypeScript
`string | undefined` error in every file.
**Subtle bug it fixes:** imports run first (depth-first), and top-level code runs at import
time — so reading `process.env` at the top of a file imported _before_ `dotenv.config()`
runs would read `undefined`. Centralizing env-loading in the earliest-imported module fixes
the ordering.

---

### Scope: one workflow, not many

**Chose:** build one permit type and one workflow end-to-end; defer family members, ICT,
Blue Card, 30% ruling, relocation, payslips.
**Because:** the original design has ~9 workflows, but they're all the same underlying
pattern (a record moving through stages). Building one _well_ demonstrates the same
engineering as building ten; the extra ones add scope and risk (never finishing), not new
skill. Finishing one deep, defensible workflow beats abandoning a sprawling one.
**Principle:** scope discipline is how portfolio projects succeed — the most common failure
mode is over-scoping and never shipping.

---

### Why Vitest over Jest

**Chose:** Vitest (+ Supertest).
**Because:** the project uses TypeScript 7, and `ts-jest` only officially supports TS
`>=4.3 <7` — installing Jest hit a peer-dependency conflict. Vitest handles TypeScript
natively (no ts-jest), so it sidesteps the conflict, and it shares Jest's API
(`describe`/`it`/`expect`), so the concepts and most tutorials transfer.
**Principle:** on a peer-dependency conflict, don't blindly `--force` past it — understand
why (here: TS newer than the tool supports) and pick a compatible tool. Path of least
friction over forcing the "standard" one into an unsupported config.

---

### Why split `app.ts` from `index.ts`

**Chose:** `app.ts` builds and exports the Express app (routes, middleware); `index.ts`
imports it, connects the DB, and starts listening.
**Because:** tests need the app _without_ it listening on a port — Supertest calls the app
directly in-memory. If app-creation and server-start were tangled together, every test
would need a real running server. This is dependency injection at the module level: the
server imports the app; the app never reaches for the server.
**Payoff:** the auth tests run in ~10ms with no port opened and no real database touched.

---

### Why an in-memory test database

**Chose:** `mongodb-memory-server` — a real MongoDB running in RAM, spun up for the test
run and wiped between every test.
**Because:** tests must be isolated and repeatable. Running them against the real Atlas
database would pollute real data, be slow, require network, and fail unpredictably (e.g. a
leftover user from a prior run breaking a "duplicate" test). An in-memory DB gives each run
a clean slate, needs no network, and can't touch real data. Bonus: tests become portable to
CI, since they carry their own database.

---

### Deployment: simple hosts now, AWS later

**Chose:** Vercel (frontend) + Railway/Render (backend) + MongoDB Atlas for now; AWS as a
later, separate chapter.
**Because:** these have free tiers and click-to-deploy, getting the app live fast without
drowning in infrastructure (EC2, VPCs, IAM, security groups) that teaches ops, not the
backend fundamentals that are the current gap. AWS is worth learning — but as its own
focused effort, ideally by redeploying a finished, understood app.
**Principle:** don't let infrastructure become a scope trap that eats momentum before the
app exists.

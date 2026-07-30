# Engineering Decisions & Tradeoffs

A record of notable decisions and *why* they were made — the reasoning, the
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
**Deeper point:** the durable skill is *data modeling* (schema design, indexing,
relationships), which transfers between both. The specific database matters far less than
understanding *why* the data is modeled the way it is.

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
**Interview framing:** the answer to "REST vs GraphQL" is the *tradeoff*, never "one is better."

---

### Why JWT (stateless) auth

**Chose:** JWT.
**Because:** HTTP is stateless — each request arrives with no memory of the last. A signed
token carries the user's identity/role in the request itself, so the server can verify it
without a database lookup or server-side session store (which would break across multiple
server instances).
**Key property:** a JWT is *signed, not encrypted* — the payload is readable by anyone, so
it holds only non-sensitive identifiers (userId, role, organization), never secrets. The
signature proves it wasn't tampered with.
**Tradeoff:** stateless tokens can't be easily revoked before expiry (a logout doesn't
invalidate an already-issued token). Mitigations (short expiry, refresh tokens, a denylist)
exist and are a later concern.

---

### Why write the backend by hand (not with AI)

**Chose:** write every line of application logic myself; use AI as a tutor/reviewer, not an
author.
**Because:** the durable, AI-resistant skill is *judgment* — being able to read, debug,
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
time — so reading `process.env` at the top of a file imported *before* `dotenv.config()`
runs would read `undefined`. Centralizing env-loading in the earliest-imported module fixes
the ordering.

---

### Scope: one workflow, not many

**Chose:** build one permit type and one workflow end-to-end; defer family members, ICT,
Blue Card, 30% ruling, relocation, payslips.
**Because:** the original design has ~9 workflows, but they're all the same underlying
pattern (a record moving through stages). Building one *well* demonstrates the same
engineering as building ten; the extra ones add scope and risk (never finishing), not new
skill. Finishing one deep, defensible workflow beats abandoning a sprawling one.
**Principle:** scope discipline is how portfolio projects succeed — the most common failure
mode is over-scoping and never shipping.

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

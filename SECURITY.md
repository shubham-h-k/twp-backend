# Security Practices — TWP (Track Work Permit)

A running record of the security decisions made while building the backend,
and _why_ each one matters. Written so I can defend every choice in an interview.

---

## Authentication

- **Passwords are hashed with bcrypt, never stored as plaintext.**
  The database only ever holds an irreversible hash (`$2b$...`), so no one —
  not me, not a DBA, not an attacker who steals the database — can read a user's
  real password. This matters especially because people reuse passwords across
  sites, so a plaintext leak would compromise their _other_ accounts too.

- **Password hashing is done asynchronously (`bcrypt.hash`), never the sync version.**
  Hashing is deliberately slow (~100ms). The sync version would block Node's single
  main thread for that whole time, freezing the entire server for _every_ user on
  _every_ request. Async hands the work to the thread pool and keeps the server
  responsive under load.

- **Login verifies with `bcrypt.compare`, never by un-hashing.**
  You can't reverse a hash. `bcrypt.compare` hashes the incoming password the same
  way and compares hashes — so login works without the server ever seeing or storing
  the real password.

- **JWTs are signed with a secret (`JWT_SECRET`).**
  A JWT payload is only base64-encoded (readable by anyone), NOT encrypted. The
  signature is what proves the token was issued by our server and hasn't been
  tampered with. Without signing, a user could edit their token's `role` to
  `caseworker` and escalate privileges. The secret is the only thing preventing
  token forgery — so it's treated like a master password.

---

## Preventing information leakage

- **Login returns an identical response for "email not found" and "wrong password."**
  Same status code (401) and same message ("Invalid email or password") for both.
  If they differed, an attacker could submit many emails and learn which ones are
  registered (user enumeration) — building a verified list of users for phishing or
  brute-force. Identical responses give the attacker nothing.

- **Clients get generic error messages; full errors are logged server-side only.**
  On any failure the client sees "Something went wrong"; the real error is
  `console.error`'d on the server. Detailed errors can reveal database structure,
  schema, or internals that help an attacker.

- **A global error handler prevents stack traces from ever reaching the client.**
  A malformed request (e.g. no body) once returned a full stack trace exposing file
  paths, directory structure, and framework internals. The global error handler
  (registered last, with 4 params) catches any unhandled error, logs it internally,
  and returns a clean generic 500 — so internals never leak.

---

## Data handling

- **The password field uses `select: false` in the schema.**
  Password hashes are excluded from query results by default, so they can't be
  accidentally sent to the frontend. Login explicitly overrides this with
  `.select("+password")` only where the hash is actually needed for comparison.
  (Defense in depth — even a careless "return the user object" won't leak the hash.)

---

## Configuration & secrets

- **Secrets live in `.env`, which is never committed (`.gitignore`).**
  The Mongo connection string (with DB password) and `JWT_SECRET` are environment
  variables. Committing them to a public repo would expose credentials and allow
  token forgery. Different secrets are used in production vs local.

- **The server fails fast at startup if required config is missing.**
  `MONGO_URI` and `JWT_SECRET` are checked at boot; if absent, the process exits
  immediately with a clear message (`process.exit(1)`). Better to crash loudly at
  startup than to sign tokens with `undefined` or fail mysteriously on every request.

---

## Database access (MongoDB Atlas)

- **Network access is restricted by IP allow-list.**
  Only whitelisted IPs can reach the cluster. For production, the app server's IP
  is whitelisted — NOT `0.0.0.0/0` (allow-from-anywhere), which is only acceptable
  for local development because the DB password becomes the sole protection.

---

## Mindset

- **Defense in depth: no single layer is "safe."**
  Error handling, authentication, authorization/RBAC, data isolation, and input
  validation each close _some_ holes, none closes all. Security is layered and
  ongoing. The scariest bugs (e.g. one org reading another's data) often throw no
  error at all — they succeed while returning the wrong data — so "it didn't crash"
  never means "it's secure."

---

## Still to implement (not done yet)

- **Input validation with Zod** — validate/type every request body; reject malformed,
  wrong-type, or invalid values before using them (never trust the client).
- **Auth middleware** — verify the JWT on protected routes; attach the user to the request.
- **RBAC** — enforce that a user's role permits the action.
- **Data isolation (multi-tenancy)** — org users see only their own organization's data.
- **Automated tests** — including a test asserting malformed input returns a clean
  error, not a stack trace.

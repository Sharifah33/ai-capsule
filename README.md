# AI Capsule — Cloud-Deployed AI Prompt Manager

CSE3CWA/CSE5006 — Assignment 3. A small full-stack app for saving and
managing AI prompt records, protected behind GitHub OAuth with an
Express-issued JWT.

## 1. Deployed application

- **Public URL:** https://ai-capsule-sks3.onrender.com
- **Cloud platform used:** Render (free web service tier)

## 2. Tech stack

- Frontend: React (Vite)
- Backend: Node.js + Express
- Auth: GitHub OAuth → Express-issued application JWT (Secure, HttpOnly
  cookie named `token`)
- Storage: SQLite (`better-sqlite3`)

## 3. Setup & run instructions (local)

```bash
# 1. Install server dependencies (from the project root)
npm install

# 2. Install client dependencies
cd client && npm install && cd ..

# 3. Configure environment variables
cp .env.example .env
# then fill in JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
# GITHUB_CALLBACK_URL and APP_BASE_URL in .env

# 4. Build the React frontend (Express serves the built files)
npm run build:client

# 5. Start the server
npm start
# -> http://localhost:5000
```

For frontend-only iteration with hot reload, `cd client && npm run dev`
(runs on :5173 and proxies `/api` and `/login` to the Express server on
:5000 — see `client/vite.config.js`).

### Creating the GitHub OAuth App

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: your deployed URL (or `http://localhost:5000` for local dev).
3. Authorization callback URL: **must exactly match** `GITHUB_CALLBACK_URL`
   in `.env`, e.g. `https://your-app.onrender.com/api/auth/github/callback`.
4. Copy the generated Client ID and Client Secret into your environment
   variables (never into the repo).

### Deploying to Render

- **Build Command:** `npm install && cd client && npm install --include=dev && npm run build && cd ..`
  (the `--include=dev` is required because Render sets `NODE_ENV=production`
  for the build step too, and npm skips `devDependencies` — including
  `vite` — by default under that flag; without it the client build fails
  with `vite: not found`.)
- **Start Command:** `npm start`
- **Environment variable `NODE_VERSION`:** set to `20.18.0`. Render's
  default Node version (26.x) is too new for `better-sqlite3`'s native
  module to compile against out of the box; pinning to Node 20 lets it
  install from a prebuilt binary instead of failing the build.
- Set all seven environment variables listed in §6 in Render's
  "Environment" tab, with `GITHUB_CALLBACK_URL` and `APP_BASE_URL`
  pointing at the deployed URL (not localhost), and `NODE_ENV=production`.
- Update the GitHub OAuth App's "Authorization callback URL" to the
  deployed callback URL too — GitHub OAuth Apps only support one
  callback URL at a time, so switching between local and deployed
  testing means updating it each time.

## 4. Required routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Redirects to GitHub OAuth |
| `/dashboard` | Protected | Authenticated user's capsule records |
| `GET /api/health` | Public | `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read own records |
| `POST /api/capsules` | Protected | Create own record |
| `PUT /api/capsules/:id` | Protected | Update own record |
| `DELETE /api/capsules/:id` | Protected | Delete own record |

The React frontend talks to Express entirely through `fetch()` calls in
`client/src/api.js`, using `credentials: "include"` so the `token` cookie
is sent automatically. The app is served from a single origin in
production (Express serves the built `client/dist`), so no CORS
configuration is needed.

## 5. OAuth / JWT flow

1. `GET /login` redirects the browser to GitHub's OAuth authorize screen
   (`routes/auth.js` → `startGithubLogin`).
2. GitHub redirects back to `GET /api/auth/github/callback?code=...`.
3. The server exchanges the code for a **GitHub** access token, uses it
   once to fetch the GitHub profile (`id`, `login`, `avatar_url`), then
   discards it.
4. The server signs its **own** application JWT (`jsonwebtoken`,
   `JWT_SECRET`) containing `{ sub: githubUserId, username, avatar }`.
5. That JWT is set as a cookie named `token` with
   `httpOnly: true, secure: true (in prod), sameSite: "lax"`.
6. Every `/api/capsules` route is mounted behind `middleware/requireAuth.js`,
   which reads the `token` cookie, verifies it with `jsonwebtoken.verify`,
   and rejects with `401` if it's missing or invalid. The authenticated
   `user_id` always comes from `req.user.sub` (the verified JWT) — it is
   never accepted from the request body or query string.

## 6. Environment variables (names only — no values)

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `APP_BASE_URL`

## 7. Database

- SQLite file (`capsules.sqlite`), created automatically on first run by
  `db.js` if it doesn't exist, using the exact schema specified in the
  assignment brief.
- Every record has a `user_id` column populated from the verified JWT.
  `GET`/`PUT`/`DELETE` all filter by `WHERE user_id = ?`, so a user can
  only ever see or modify their own records (verified locally — see
  §9 below).
- **Persistence:** Deployed on Render's free web service tier, where the
  filesystem is ephemeral — the SQLite file is wiped on restart/redeploy.
  This is a known, disclosed limitation of the assignment's minimum
  storage requirement, not a bug.

## 8. Required cURL checks

Run against the deployed URL:

```bash
# Test 1 - no authentication
curl -i https://ai-capsule-sks3.onrender.com/api/capsules

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-sks3.onrender.com/api/capsules
```

**Results:**

Test 1 (no cookie):
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{"error":"Unauthorized"}
```

Test 2 (fake cookie `token=fake-token-123`):
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
x-powered-by: Express

{"error":"Unauthorized"}
```

Both requests were correctly rejected before the JWT middleware allowed
any capsule data to be returned.

## 9. Known limitation

SQLite storage is not persistent on Render's free tier — the filesystem
is ephemeral, so all capsule data is lost on redeploy or when the free
instance restarts after a period of inactivity. There is also no
refresh-token flow, so sessions expire after 2 hours and require signing
in again.

## 10. AI-assisted development statement

- **Tool(s) used:** Claude
- **What it helped with:** we worked together on the initial project
  scaffold (Express routes, React components, SQLite schema wiring), the
  GitHub OAuth → JWT → HttpOnly cookie flow, diagnosing two Render
  deployment failures, and this README structure.
- **What I personally completed:** created the GitHub OAuth App and
  configured its callback URL (twice — once for local testing, once for
  the deployed URL, since a GitHub OAuth App only supports one callback
  URL at a time); created and configured the Render web service,
  including all environment variables; pushed the code to GitHub and
  connected it to Render; ran and read the Render build logs to diagnose
  both deployment failures; ran the required cURL checks against the
  live deployed API and confirmed the results; tested the full CRUD
  cycle and the GitHub login flow through the browser on the deployed
  app.
- **One problem found and corrected:** the initial Render Build Command
  (`npm install && npm run build:client`) failed with `vite: not found`
  because `NODE_ENV=production` was set as an environment variable, and
  npm's default behaviour under that flag is to skip installing
  `devDependencies` — including `vite`, which the client build needs.
  Fixed by changing the Build Command to explicitly run
  `npm install --include=dev` for the client. A related issue: the
  default Node version on Render (26.x) was too new for `better-sqlite3`
  to compile its native module against; fixed by pinning
  `NODE_VERSION=20.18.0`.
- **How OAuth login, JWT verification and protected API behaviour were
  verified:** Logged in through GitHub in the browser on both the local
  and deployed apps, confirming the `token` cookie was set as
  `HttpOnly`/`Secure`; ran both required cURL checks against the
  deployed `/api/capsules` and confirmed `401 Unauthorized` in both
  cases; confirmed authenticated requests from the browser succeeded and
  landed correctly on `/dashboard`.
- **How CRUD behaviour and user data ownership were verified:** Locally,
  signed requests with two different JWTs (different `sub` claims) via
  cURL and confirmed a record created under one user's token was
  invisible to `GET` under the other, and that `PUT`/`DELETE` against
  the first user's record ID returned `404` when sent with the second
  user's token rather than succeeding. On the deployed app, created,
  read, updated and deleted a capsule record end-to-end through the
  dashboard UI as the authenticated GitHub user.
- **One implementation/deployment decision I made and can explain:**
  chose to serve the React build from the same Express app instead of a
  separate static host, so the frontend and API share one origin — this
  avoids the CORS and cross-origin cookie configuration that would
  otherwise be needed for the HttpOnly JWT cookie to be sent with
  requests.

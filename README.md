# AI Capsule — Cloud-Deployed AI Prompt Manager

CSE3CWA/CSE5006 — Assignment 3. A small full-stack app for saving and
managing AI prompt records, protected behind GitHub OAuth with an
Express-issued JWT.

> ⚠️ **Fill in the blanks marked `TODO` before submitting.** This README
> ships as a complete template with all required sections in place — the
> code has been built and locally smoke-tested, but the OAuth
> credentials, deployed URL, and cURL results still need to be filled in
> once you deploy.

## 1. Deployed application

- **Public URL:** `TODO: https://your-app-name.onrender.com`
- **Cloud platform used:** `TODO: Render / Azure App Service / other`

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
- **Persistence:** `TODO — state which platform you deployed to and
  whether its filesystem is persistent.` On Render's free web service the
  filesystem is ephemeral, so the SQLite file is wiped on restart/redeploy;
  this is a known, disclosed limitation of the assignment's minimum
  storage requirement, not a bug.

## 8. Required cURL checks

Run against the **deployed** URL before submitting, and paste the actual
output below.

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP/api/capsules
# Required: 401 Unauthorized

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Required: 401 Unauthorized
```

**Results:**

```
TODO: paste Test 1 output here
```

```
TODO: paste Test 2 output here
```

## 9. Known limitation

`TODO: state one honest limitation`, e.g.: SQLite storage is not
persistent on Render's free tier — data is lost on redeploy/restart. No
refresh-token flow; sessions expire after 2 hours and require signing in
again. No file upload for screenshots — evidence is a URL only, as
permitted by the brief.

## 10. AI-assisted development statement

- **Tool(s) used:** `TODO, e.g. Claude`
- **What it helped with:** initial project scaffold (Express routes,
  React components, SQLite schema wiring), the GitHub OAuth → JWT →
  HttpOnly cookie flow, and this README structure.
- **What I personally completed:** `TODO — describe the parts you wrote,
  configured, debugged, or changed yourself: e.g. creating the GitHub
  OAuth App and setting the callback URL, configuring the Render service
  and environment variables, testing the deployed cURL checks, adjusting
  the UI.`
- **One problem found and corrected in AI-generated code/config:**
  `TODO — e.g. "the initial cookie config used sameSite: 'none' which
  requires secure:true even in local dev and broke the OAuth redirect
  over http://localhost; changed to sameSite: 'lax' for same-origin use."`
- **How OAuth login, JWT verification and protected API behaviour were
  verified:** Logged in through GitHub in the browser and confirmed the
  `token` cookie was set as `HttpOnly`/`Secure` in DevTools; ran both
  required cURL checks against the deployed `/api/capsules` and confirmed
  `401 Unauthorized` in both cases; confirmed authenticated requests from
  the browser succeeded.
- **How CRUD behaviour and user data ownership were verified:** Created,
  read, updated and deleted capsule records through the dashboard UI for
  one logged-in account, then signed in as a second GitHub account and
  confirmed its `/api/capsules` list was empty and that attempting to
  `PUT`/`DELETE` the first account's record IDs returned `404` rather
  than succeeding.
- **One implementation/deployment decision I made and can explain:**
  `TODO — e.g. "chose to serve the React build from the same Express app
  instead of a separate static host, to avoid cross-origin cookie
  issues with the HttpOnly JWT cookie."`

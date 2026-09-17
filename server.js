// server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const requireAuth = require("./middleware/requireAuth");
const { router: authRouter, startGithubLogin } = require("./routes/auth");
const capsulesRouter = require("./routes/capsules");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

// ---- Public: health check (required exact path/response) ----
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---- Public: OAuth ----
// /login must be a bare top-level path (not under /api) per the spec.
app.get("/login", startGithubLogin);
app.use("/api/auth", authRouter); // includes /api/auth/github/callback, /me, /logout

// ---- Protected: capsule CRUD ----
// requireAuth guards GET/POST/PUT/DELETE uniformly.
app.use("/api/capsules", requireAuth, capsulesRouter);

// ---- Serve the built React frontend (same app, same origin) ----
const clientDist = path.join(__dirname, "client", "dist");
app.use(express.static(clientDist));

// SPA fallback: "/" and "/dashboard" (and any other client route) all get
// index.html; React Router takes it from there. The dashboard's *data*
// (via /api/capsules) is what's actually protected — see routes/capsules.js.
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT}`);
});

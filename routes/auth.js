// routes/auth.js
//
// GitHub OAuth -> Express-issued application JWT -> HttpOnly cookie.
//
// Flow:
//   1. GET /login                 -> redirect to GitHub's authorize screen
//   2. GET /api/auth/github/callback -> exchange code for GitHub access token,
//                                        fetch the GitHub user, mint OUR OWN
//                                        JWT (not GitHub's token), set it as
//                                        a Secure/HttpOnly cookie named
//                                        `token`, redirect to /dashboard
//   3. GET /api/auth/me           -> protected; lets the frontend check who
//                                    (if anyone) is logged in
//   4. POST /api/auth/logout      -> clears the cookie

const express = require("express");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  APP_BASE_URL,
  JWT_SECRET,
  NODE_ENV,
} = process.env;

const isProd = NODE_ENV === "production";

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd, // HTTPS only in production (Render terminates TLS for you)
    sameSite: "lax", // same-origin app (frontend served by this same Express app)
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });
}

// --- /login is mounted at the top level in server.js (not under /api) ---
// Exported separately so server.js can attach it to the bare "/login" path
// that the assignment spec requires.
function startGithubLogin(req, res) {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user",
    allow_signup: "true",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing OAuth code from GitHub.");
  }

  try {
    // 1. Exchange the code for a GitHub access token
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return res.status(401).send("GitHub OAuth failed during token exchange.");
    }

    // 2. Use the GitHub access token ONCE, just to identify the user.
    //    We do NOT store this token anywhere — our own JWT replaces it.
    const userResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "ai-capsule-app",
      },
    });
    const githubUser = await userResp.json();

    if (!githubUser || !githubUser.id) {
      return res.status(401).send("Could not retrieve GitHub profile.");
    }

    // 3. Mint OUR application JWT. This is the required "application JWT".
    const appToken = jwt.sign(
      {
        sub: String(githubUser.id), // stable GitHub user id -> our user_id
        username: githubUser.login,
        avatar: githubUser.avatar_url,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 4. Store it as a Secure, HttpOnly cookie named "token".
    setAuthCookie(res, appToken);

    return res.redirect(`${APP_BASE_URL}/dashboard`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.status(500).send("Something went wrong during login.");
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    id: req.user.sub,
    username: req.user.username,
    avatar: req.user.avatar,
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  });
  res.json({ ok: true });
});

module.exports = { router, startGithubLogin };

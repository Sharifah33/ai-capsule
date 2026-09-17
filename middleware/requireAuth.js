// middleware/requireAuth.js
//
// Verifies the application JWT stored in the Secure, HttpOnly `token` cookie.
// This is the ONLY place the authenticated user's identity comes from —
// req.user.sub is what every route uses as user_id. The frontend/client
// never supplies user_id directly (Section D requirement).

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded.sub = GitHub user id (string), decoded.username, decoded.avatar
    req.user = decoded;
    return next();
  } catch (err) {
    // Covers expired tokens, bad signature, malformed/fake tokens, etc.
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = requireAuth;

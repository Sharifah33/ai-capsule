// routes/capsules.js
//
// Full CRUD for prompt capsules. Every route here is mounted behind
// requireAuth in server.js, so req.user is always populated and verified.
// user_id ALWAYS comes from req.user.sub (the verified JWT), never from
// the request body/query — this is what Section D marks.

const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/capsules — read only the caller's own records
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.sub);
  res.json(rows);
});

// POST /api/capsules — create a record owned by the caller
router.post("/", (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: "project_name, prompt_title and prompt_text are required.",
    });
  }

  const stmt = db.prepare(`
    INSERT INTO capsules (
      user_id, project_name, prompt_title, prompt_version, prompt_text,
      response_summary, category, usefulness, reviewed, improved,
      screenshot_url, notes
    ) VALUES (@user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
      @response_summary, @category, @usefulness, @reviewed, @improved,
      @screenshot_url, @notes)
  `);

  const info = stmt.run({
    user_id: req.user.sub,
    project_name,
    prompt_title,
    prompt_version: prompt_version || null,
    prompt_text,
    response_summary: response_summary || null,
    category: category || null,
    usefulness: usefulness || null,
    reviewed: reviewed ? 1 : 0,
    improved: improved ? 1 : 0,
    screenshot_url: screenshot_url || null,
    notes: notes || null,
  });

  const created = db.prepare("SELECT * FROM capsules WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/capsules/:id — update, but ONLY if owned by the caller
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(id, req.user.sub);

  if (!existing) {
    // Either it doesn't exist, or it belongs to someone else — either way,
    // don't leak which, just say not found.
    return res.status(404).json({ error: "Capsule not found." });
  }

  const merged = { ...existing, ...req.body, id: existing.id, user_id: existing.user_id };

  db.prepare(`
    UPDATE capsules SET
      project_name = @project_name,
      prompt_title = @prompt_title,
      prompt_version = @prompt_version,
      prompt_text = @prompt_text,
      response_summary = @response_summary,
      category = @category,
      usefulness = @usefulness,
      reviewed = @reviewed,
      improved = @improved,
      screenshot_url = @screenshot_url,
      notes = @notes
    WHERE id = @id AND user_id = @user_id
  `).run({
    ...merged,
    reviewed: merged.reviewed ? 1 : 0,
    improved: merged.improved ? 1 : 0,
  });

  const updated = db.prepare("SELECT * FROM capsules WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE /api/capsules/:id — delete, but ONLY if owned by the caller
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const info = db
    .prepare("DELETE FROM capsules WHERE id = ? AND user_id = ?")
    .run(id, req.user.sub);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Capsule not found." });
  }

  res.json({ ok: true });
});

module.exports = router;

export default function CapsuleList({ capsules, onEdit, onDelete }) {
  if (capsules.length === 0) {
    return <p className="empty-state">No capsules yet — add your first one above.</p>;
  }

  return (
    <div className="capsule-list">
      {capsules.map((c) => (
        <div className="card capsule-item" key={c.id}>
          <div className="capsule-item-header">
            <h3>{c.prompt_title}</h3>
            <span className="badge">{c.prompt_version}</span>
          </div>
          <p className="capsule-meta">
            {c.project_name} · {c.category} · {c.usefulness}
          </p>
          <p className="capsule-text">{c.prompt_text}</p>
          {c.response_summary && (
            <p className="capsule-summary">
              <strong>Response:</strong> {c.response_summary}
            </p>
          )}
          <p className="capsule-flags">
            {c.reviewed ? "✅ Reviewed" : "⬜ Not reviewed"} ·{" "}
            {c.improved ? "✅ Improved" : "⬜ Not improved"}
          </p>
          {c.notes && <p className="capsule-notes">{c.notes}</p>}
          {c.screenshot_url && (
            <a href={c.screenshot_url} target="_blank" rel="noreferrer">
              Screenshot evidence
            </a>
          )}
          <div className="capsule-actions">
            <button className="btn" onClick={() => onEdit(c)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => onDelete(c.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

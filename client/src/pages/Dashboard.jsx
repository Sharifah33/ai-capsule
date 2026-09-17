import { useEffect, useState } from "react";
import { api } from "../api.js";
import CapsuleForm from "../components/CapsuleForm.jsx";
import CapsuleList from "../components/CapsuleList.jsx";

export default function Dashboard() {
  const [status, setStatus] = useState("loading"); // loading | ready | unauthorized | error
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const me = await api.me();
      setUser(me);
      const list = await api.listCapsules();
      setCapsules(list);
      setStatus("ready");
    } catch (err) {
      if (err.status === 401) {
        // Not logged in (or session expired) — this is the client-side half
        // of "protected dashboard": no valid session, no data, no access.
        setStatus("unauthorized");
      } else {
        setErrorMsg(err.message);
        setStatus("error");
      }
    }
  }

  async function handleSave(formData) {
    try {
      if (editingCapsule) {
        await api.updateCapsule(editingCapsule.id, formData);
      } else {
        await api.createCapsule(formData);
      }
      setEditingCapsule(null);
      const list = await api.listCapsules();
      setCapsules(list);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this capsule?")) return;
    try {
      await api.deleteCapsule(id);
      setCapsules((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleLogout() {
    await api.logout();
    window.location.href = "/";
  }

  if (status === "loading") {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="page page-home">
        <div className="card">
          <h1>Please sign in</h1>
          <p>You need to sign in with GitHub to view your dashboard.</p>
          <a className="btn btn-primary" href="/login">
            Sign in with GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="dashboard-header">
        <div>
          <h1>Your capsules</h1>
          {user && <p className="subtle">Signed in as {user.username}</p>}
        </div>
        <button className="btn" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {errorMsg && <p className="error-banner">{errorMsg}</p>}

      <CapsuleForm
        editingCapsule={editingCapsule}
        onSave={handleSave}
        onCancel={() => setEditingCapsule(null)}
      />

      <CapsuleList
        capsules={capsules}
        onEdit={(c) => setEditingCapsule(c)}
        onDelete={handleDelete}
      />
    </div>
  );
}

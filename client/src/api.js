// api.js — thin fetch wrapper.
//
// credentials: "include" is required so the browser sends/receives the
// HttpOnly `token` cookie. Since the app is served from the same origin as
// the API in production, this works with sameSite: "lax" without any CORS
// configuration.

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  listCapsules: () => request("/api/capsules"),
  createCapsule: (data) =>
    request("/api/capsules", { method: "POST", body: JSON.stringify(data) }),
  updateCapsule: (id, data) =>
    request(`/api/capsules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: "DELETE" }),
};

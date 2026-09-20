const API = "";

export async function api(path, { method = "GET", body, session } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (session?.role) headers["X-Role"] = session.role;
  if (session?.familyId) headers["X-Family-Id"] = session.familyId;
  if (session?.officerId) headers["X-Officer-Id"] = session.officerId;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

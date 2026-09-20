import { useEffect, useState } from "react";
import { api } from "../api/http.js";
import { useSession } from "../session/SessionContext.jsx";
import { Banner, Field } from "../components/Field.jsx";

const FALLBACK = {
  stakeholders: [
    { username: "GJ-F-48291753", password: "Head@123", desk: "Family Head" },
    { username: "registry.officer", password: "Reg@123", desk: "Registry Officer" },
    { username: "scheme.creator", password: "Cre@123", desk: "Scheme Creator" },
    { username: "scheme.officer", password: "Off@123", desk: "Scheme Manager (all schemes)" }
  ],
  schemeDesks: []
};

function AccountTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <table>
      <thead>
        <tr>
          <th>Family ID / Username</th>
          <th>Password</th>
          <th>Desk</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.username}>
            <td className="id">{r.username}</td>
            <td className="id">{r.password}</td>
            <td>
              {r.desk}
              {r.schemeId ? <div className="id">{r.schemeId}</div> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LoginPage() {
  const { login } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demos, setDemos] = useState(FALLBACK);

  useEffect(() => {
    api("/auth/demo-accounts")
      .then(setDemos)
      .catch(() => setDemos(FALLBACK));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: { username, password }
      });
      login(session);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="tricolor">
        <span className="saffron" />
        <span className="white" />
        <span className="green" />
      </div>
      <header className="topbar">
        <div className="brand">
          <strong>Gujarat Family ID</strong>
          <small>Citizen services · Beneficiary &amp; scheme desk</small>
        </div>
      </header>
      <div className="login-body">
        <div className="card login-card">
          <h2>Login</h2>
          <p className="lead">Family Head: Family ID and password. Officers: username and password. Each scheme desk is separate.</p>
          <Banner error={error} />
          <form onSubmit={submit}>
            <Field label="Family ID / Username" required>
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label="Password" required>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Login"}
            </button>
          </form>
          <div className="demo-accounts">
            <p className="notice">Demo accounts for this prototype</p>
            <AccountTable rows={demos.stakeholders} />
            {demos.schemeDesks?.length ? (
              <>
                <p className="notice" style={{ marginTop: 14 }}>Scheme officer desks (issued when a scheme is announced)</p>
                <AccountTable rows={demos.schemeDesks} />
              </>
            ) : null}
          </div>
        </div>
      </div>
      <footer className="footer">
        Government of Gujarat · Family ID register (prototype). Not an official portal.
      </footer>
    </div>
  );
}

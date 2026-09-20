import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner } from "../../components/Field.jsx";
import { StatCards } from "./Lifecycle.jsx";

export function OfficerOverview() {
  const { session } = useSession();
  const scoped = Boolean(session.schemeId);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api("/officer/overview", { session })
      .then(setBoard)
      .catch((e) => setError(e.message));
  }, [session.role, session.officerId, session.schemeId]);

  return (
    <div className="card">
      <h2>{scoped ? `${session.schemeName || "Scheme"} analysis` : "Scheme desk analysis"}</h2>
      <p className="lead">
        One board for the desk: how many applications have come in, how many are still pending, how many were accepted or rejected, and how many households are already receiving the scheme.
      </p>
      <Banner error={error} />
      <StatCards totals={board?.totals} />
      <table>
        <thead>
          <tr>
            <th>Scheme</th>
            <th>Applications</th>
            <th>Pending</th>
            <th>Approved</th>
            <th>Rejected</th>
            <th>Receiving</th>
          </tr>
        </thead>
        <tbody>
          {(board?.schemes || []).map((s) => (
            <tr key={s.schemeId}>
              <td>
                <strong>{s.name}</strong>
                <div className="id">{s.schemeId}</div>
                <div className="notice">{s.appliesTo === "FAMILY" ? "Whole household" : "One person"}</div>
              </td>
              <td>{s.applications}</td>
              <td>{s.pending}</td>
              <td>{s.approved}</td>
              <td>{s.rejected}</td>
              <td>{s.receiving}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!board?.schemes?.length ? <p className="notice">No schemes on this desk yet.</p> : null}
    </div>
  );
}

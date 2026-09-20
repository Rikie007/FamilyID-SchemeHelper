import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";

export function HeadApplications() {
  const { session } = useSession();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/me/applications", { session })
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [session.role, session.familyId]);

  return (
    <div className="card">
      <h2>અરજી સ્થિતિ / Application tracker</h2>
      <Banner error={error} />
      <table>
        <thead>
          <tr>
            <th>Application</th>
            <th>Scheme</th>
            <th>Member</th>
            <th>Status</th>
            <th>Applied</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.applicationId}>
              <td className="id">{r.applicationId}</td>
              <td className="id">{r.schemeId}</td>
              <td>{r.memberId || "Family"}</td>
              <td><StatusChip value={r.status} /></td>
              <td>{r.appliedOn}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <p className="notice">No applications yet.</p> : null}
    </div>
  );
}

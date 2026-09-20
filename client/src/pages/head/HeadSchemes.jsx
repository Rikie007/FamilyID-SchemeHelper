import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";

export function HeadSchemes() {
  const { session } = useSession();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function load() {
    setError("");
    const data = await api("/me/schemes", { session });
    setBoard(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [session.role, session.familyId]);

  async function apply(schemeId, memberId) {
    setError("");
    setInfo("");
    try {
      const body = memberId ? { schemeId, memberId } : { schemeId };
      const doc = await api("/me/applications", { method: "POST", body, session });
      setInfo(`Application ${doc.applicationId} submitted.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!board && !error) return <p>Loading schemes…</p>;

  return (
    <div className="card">
      <h2>યોજના / Announced schemes</h2>
      <p className="lead">Eligibility is computed on the server from the family register.</p>
      <Banner error={error} info={info} />
      {(board?.rows || []).map((row) => (
        <div key={row.scheme.schemeId} className="card" style={{ boxShadow: "none" }}>
          <h2>{row.scheme.name}</h2>
          <p className="lead">
            {row.scheme.appliesTo === "FAMILY" ? "Whole household" : "One person in the household"}
          </p>
          {row.scheme.summary ? <p className="notice">{row.scheme.summary}</p> : null}
          {row.scheme.appliesTo === "FAMILY" ? (
            <div className="actions">
              <StatusChip value={row.verdict} />
              {row.verdict === "Eligible" ? (
                <button className="primary" onClick={() => apply(row.scheme.schemeId)}>અરજી / Apply for family</button>
              ) : null}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Verdict</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {row.members.map((m) => (
                  <tr key={m.memberId}>
                    <td>{m.fullName}<div className="id">{m.memberId}</div></td>
                    <td>
                      <StatusChip value={m.verdict} /> {m.note}
                    </td>
                    <td>
                      {m.verdict === "Eligible" ? (
                        <button className="primary" onClick={() => apply(row.scheme.schemeId, m.memberId)}>Apply</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

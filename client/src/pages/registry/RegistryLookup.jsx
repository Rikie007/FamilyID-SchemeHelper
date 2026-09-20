import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";
import { Lifecycle } from "../officer/Lifecycle.jsx";

export function FamilyDossier({ familyId }) {
  const { session } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    if (!familyId) return;
    api(`/register/families/${encodeURIComponent(familyId)}`, { session })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [familyId, session.role, session.officerId, session.familyId]);

  if (!familyId) return null;

  return (
    <div className="card">
      <Banner error={error} />
      {data ? (
        <>
          <h2>{data.family.village} · Head {data.head?.fullName}</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Relation</th>
                <th>Opened</th>
                <th>Closed</th>
                <th>Period</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((row) => (
                <tr key={row.memberId + row.fromDate + row.status}>
                  <td>
                    {row.member?.fullName}
                    <div className="id">{row.memberId}</div>
                  </td>
                  <td>{row.relationToHead}</td>
                  <td>{row.openedHow}</td>
                  <td>{row.closedHow || "—"}</td>
                  <td>
                    {row.fromDate} → {row.toDate || "present"} <StatusChip value={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Scheme lifecycle for this household</h3>
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Scheme</th>
                <th>Status</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {(data.applications || []).map((r) => (
                <tr key={r.applicationId}>
                  <td className="id">{r.applicationId}</td>
                  <td>
                    {r.schemeName || r.schemeId}
                    <div className="notice">{r.memberName || r.memberId || "Family"}</div>
                  </td>
                  <td><StatusChip value={r.status} /></td>
                  <td><Lifecycle steps={r.lifecycle} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.applications?.length ? <p className="notice">No applications from this household yet.</p> : null}
        </>
      ) : null}
    </div>
  );
}

export function RegistryLookup() {
  const { session } = useSession();
  const [q, setQ] = useState("GJ-F-48291753");
  const [hits, setHits] = useState([]);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  async function search(e) {
    e.preventDefault();
    setError("");
    try {
      const rows = await api(`/register/lookup?q=${encodeURIComponent(q)}`, { session });
      setHits(rows);
      if (rows[0]) setOpenId(rows[0].familyId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Register lookup</h2>
        <p className="lead">Search Family ID, Member ID, or name. Officers see ACTIVE and LEFT history.</p>
        <Banner error={error} />
        <form onSubmit={search} className="grid-2">
          <Field label="Query" required>
            <input value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
          <div className="actions">
            <button className="primary" type="submit">Search</button>
          </div>
        </form>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Family ID</th>
              <th>Village</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hits.map((f) => (
              <tr key={f.familyId}>
                <td className="id">{f.familyId}</td>
                <td>{f.village}, {f.district}</td>
                <td><button className="ghost" onClick={() => setOpenId(f.familyId)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FamilyDossier familyId={openId} />
    </>
  );
}

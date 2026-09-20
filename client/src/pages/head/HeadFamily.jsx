import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";

export function HeadFamily() {
  const { session } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setError("");
    api("/me/family", { session })
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [session.role, session.familyId]);

  if (error) return <Banner error={error} />;
  if (!data) return <p>Loading household…</p>;

  return (
    <div className="card">
      <h2>કુટુંબ પહોંચપત્ર / Family certificate</h2>
      <p className="lead">Read-only. To change the house, walk to the Registry counter with proofs.</p>
      <dl className="kvs">
        <dt>Family ID</dt>
        <dd className="id">{data.family.familyId}</dd>
        <dt>Head</dt>
        <dd>{data.head?.fullName}</dd>
        <dt>Village</dt>
        <dd>{data.family.village}, {data.family.taluka}, {data.family.district}</dd>
      </dl>
      <table style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Name</th>
            <th>Relation</th>
            <th>DOB</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.members.map((row) => (
            <tr key={row.memberId + row.fromDate}>
              <td className="id">{row.memberId}</td>
              <td>{row.member?.fullName}</td>
              <td>{row.relationToHead}</td>
              <td>{row.member?.dob}</td>
              <td><StatusChip value={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";
import { FamilyDossier } from "../registry/RegistryLookup.jsx";

export function OfficerInbox() {
  const { session } = useSession();
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [rejectNote, setRejectNote] = useState("");
  const [openFamily, setOpenFamily] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function load() {
    const data = await api(`/officer/applications?status=${encodeURIComponent(status)}`, { session });
    setRows(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [session.role, status]);

  async function decide(id, action) {
    setError("");
    setInfo("");
    try {
      if (action === "approve") {
        await api(`/officer/applications/${id}/approve`, { method: "POST", session, body: {} });
      } else {
        await api(`/officer/applications/${id}/reject`, {
          method: "POST",
          session,
          body: { rejectNote }
        });
      }
      setInfo(`${action} ${id}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Application inbox</h2>
        <p className="lead">Verify against the register, then approve or reject.</p>
        <Banner error={error} info={info} />
        <Field label="Status filter">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>PENDING</option>
            <option>APPROVED</option>
            <option>REJECTED</option>
          </select>
        </Field>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Application</th>
              <th>Scheme</th>
              <th>Family / member</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.applicationId}>
                <td className="id">{r.applicationId}</td>
                <td className="id">{r.schemeId}</td>
                <td>
                  {r.familyId}
                  <div className="id">{r.memberId || "FAMILY"}</div>
                </td>
                <td><StatusChip value={r.status} /></td>
                <td>
                  <button className="ghost" onClick={() => setOpenFamily(r.familyId)}>Verify</button>
                  {r.status === "PENDING" ? (
                    <>
                      <button className="ok" onClick={() => decide(r.applicationId, "approve")}>Approve</button>
                      <button className="danger" onClick={() => decide(r.applicationId, "reject")}>Reject</button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Field label="Reject note (required for reject)">
          <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
        </Field>
      </div>
      <FamilyDossier familyId={openFamily} />
    </>
  );
}

export function OfficerBeneficiaries() {
  const { session } = useSession();
  const [schemeId, setSchemeId] = useState("GJ-S-FOOD-FAM-0001");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load(e) {
    e?.preventDefault();
    setError("");
    try {
      setRows(await api(`/officer/beneficiaries?schemeId=${encodeURIComponent(schemeId)}`, { session }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, [session.role]);

  return (
    <div className="card">
      <h2>Who is taking the benefit</h2>
      <Banner error={error} />
      <form onSubmit={load} className="grid-2">
        <Field label="Scheme ID">
          <input value={schemeId} onChange={(e) => setSchemeId(e.target.value)} />
        </Field>
        <div className="actions"><button className="primary" type="submit">Load</button></div>
      </form>
      <table>
        <thead>
          <tr>
            <th>Scheme</th>
            <th>Family</th>
            <th>Member</th>
            <th>Enrolled</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.schemeId + r.familyId + r.memberId + i}>
              <td className="id">{r.schemeId}</td>
              <td className="id">{r.familyId}</td>
              <td>{r.memberId || "FAMILY"}</td>
              <td>{r.enrolledOn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

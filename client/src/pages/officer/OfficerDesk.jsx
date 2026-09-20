import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";
import { Lifecycle } from "./Lifecycle.jsx";
import { FamilyDossier } from "../registry/RegistryLookup.jsx";

export function OfficerInbox() {
  const { session } = useSession();
  const [status, setStatus] = useState("ALL");
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
  }, [session.role, session.officerId, session.schemeId, status]);

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
        <h2>{session.schemeId ? `${session.schemeName || "Scheme"} inbox` : "Application inbox"}</h2>
        <p className="lead">
          {session.schemeId
            ? "Follow each application from receipt to benefit for this scheme."
            : "Follow each application from receipt to benefit. Scheme Manager sees every scheme."}
        </p>
        <Banner error={error} info={info} />
        <Field label="Status filter">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </Field>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Application</th>
              <th>Scheme</th>
              <th>Family / member</th>
              <th>Status</th>
              <th>Lifecycle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.applicationId}>
                <td className="id">{r.applicationId}</td>
                <td>
                  {r.schemeName || r.schemeId}
                  <div className="id">{r.schemeId}</div>
                </td>
                <td>
                  {r.headName || r.familyId}
                  <div className="id">{r.familyId}{r.village ? ` · ${r.village}` : ""}</div>
                  <div className="notice">{r.memberName}{r.memberId ? ` · ${r.memberId}` : ""}</div>
                </td>
                <td><StatusChip value={r.status} /></td>
                <td>
                  <Lifecycle steps={r.lifecycle} />
                </td>
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
        {!rows.length ? <p className="notice">No applications in this filter yet.</p> : null}
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
  const scoped = Boolean(session.schemeId);
  const [schemeId, setSchemeId] = useState(session.schemeId || "");
  const [schemes, setSchemes] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load(e) {
    e?.preventDefault();
    setError("");
    try {
      const q = scoped || !schemeId ? "" : `?schemeId=${encodeURIComponent(schemeId)}`;
      setRows(await api(`/officer/beneficiaries${q}`, { session }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!scoped) {
      api("/schemes", { session }).then(setSchemes).catch(() => {});
    }
    load().catch(() => {});
  }, [session.role, session.schemeId, session.officerId, schemeId]);

  return (
    <div className="card">
      <h2>{scoped ? `${session.schemeName || "Scheme"} — taking the benefit` : "Who is taking the benefit"}</h2>
      <p className="lead">
        {scoped
          ? `${rows.length} household or member currently enrolled on this scheme.`
          : `${rows.length} enrolled across the selected schemes. This is the live beneficiary list after approval.`}
      </p>
      <Banner error={error} />
      {scoped ? null : (
        <Field label="Scheme">
          <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
            <option value="">All schemes</option>
            {schemes.map((s) => (
              <option key={s.schemeId} value={s.schemeId}>{s.name} · {s.schemeId}</option>
            ))}
          </select>
        </Field>
      )}
      <table>
        <thead>
          <tr>
            <th>Scheme</th>
            <th>Household</th>
            <th>Who receives</th>
            <th>Enrolled</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.schemeId + r.familyId + r.memberId + i}>
              <td>
                {r.schemeName || r.schemeId}
                <div className="id">{r.schemeId}</div>
              </td>
              <td>
                {r.headName || r.familyId}
                <div className="id">{r.familyId}{r.village ? ` · ${r.village}` : ""}</div>
              </td>
              <td>
                {r.consumerName || (r.memberId || "FAMILY")}
                {r.memberId ? <div className="id">{r.memberId}</div> : null}
              </td>
              <td>{r.enrolledOn}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <p className="notice">Nobody is enrolled on this selection yet. Approve an application to add them here.</p> : null}
    </div>
  );
}

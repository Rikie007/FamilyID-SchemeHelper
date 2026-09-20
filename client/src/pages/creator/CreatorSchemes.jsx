import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";

const blank = {
  name: "",
  domain: "GEN",
  appliesTo: "MEMBER",
  ageMin: "",
  ageMax: "",
  gender: "ANY",
  requiresWidow: false
};

export function CreatorSchemes() {
  const { session } = useSession();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function load() {
    setRows(await api("/schemes", { session }));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [session.role]);

  async function create(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const doc = await api("/schemes", {
        method: "POST",
        session,
        body: {
          ...form,
          ageMin: form.ageMin === "" ? null : Number(form.ageMin),
          ageMax: form.ageMax === "" ? null : Number(form.ageMax)
        }
      });
      setInfo(`Announced ${doc.schemeId}`);
      setForm(blank);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Announce a scheme</h2>
        <p className="lead">Creator sets criteria. Creator cannot approve citizen applications.</p>
        <Banner error={error} info={info} />
        <form onSubmit={create} className="grid-2">
          <Field label="Name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Domain" required><input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></Field>
          <Field label="Applies to" required>
            <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}>
              <option value="FAMILY">FAMILY</option>
              <option value="MEMBER">MEMBER</option>
            </select>
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="ANY">ANY</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </Field>
          <Field label="Min age"><input value={form.ageMin} onChange={(e) => setForm({ ...form, ageMin: e.target.value })} /></Field>
          <Field label="Max age"><input value={form.ageMax} onChange={(e) => setForm({ ...form, ageMax: e.target.value })} /></Field>
          <Field label="Requires widow">
            <select value={String(form.requiresWidow)} onChange={(e) => setForm({ ...form, requiresWidow: e.target.value === "true" })}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </Field>
          <div className="actions"><button className="primary" type="submit">Publish scheme</button></div>
        </form>
      </div>
      <div className="card">
        <h2>Announced list</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Applies</th>
              <th>Criteria</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.schemeId}>
                <td className="id">{s.schemeId}</td>
                <td>{s.name}</td>
                <td>{s.appliesTo}</td>
                <td>
                  age {s.minAge ?? "—"}–{s.maxAge ?? "—"} · {s.gender}
                  {s.requiresWidow ? " · widow" : ""}
                </td>
                <td><StatusChip value={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

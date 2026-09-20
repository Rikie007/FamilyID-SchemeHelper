import { useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";
import { StatusChip } from "../../components/StatusChip.jsx";

const DEPARTMENTS = [
  ["FOOD", "Food & Civil Supplies"],
  ["EDU", "Education"],
  ["SOCIAL", "Social Justice & Empowerment"],
  ["WCD", "Women & Child Development"],
  ["HEALTH", "Health & Family Welfare"],
  ["RURAL", "Rural Development"],
  ["HOUSING", "Housing"],
  ["OTHER", "Other"]
];

const DEPT_LABEL = Object.fromEntries(DEPARTMENTS);

const blank = {
  name: "",
  summary: "",
  domain: "FOOD",
  appliesTo: "FAMILY",
  ageMin: "",
  ageMax: "",
  gender: "ANY",
  requiresWidow: false
};

function whoLabel(appliesTo) {
  return appliesTo === "FAMILY" ? "Whole household" : "One person in the household";
}

function criteriaText(s) {
  if (s.appliesTo === "FAMILY") return "Household — no person-level age/gender rule";
  const bits = [];
  if (s.gender === "M") bits.push("Male");
  else if (s.gender === "F") bits.push("Female");
  else bits.push("Any gender");
  if (s.minAge != null || s.maxAge != null) {
    bits.push(`age ${s.minAge ?? "any"}–${s.maxAge ?? "any"}`);
  }
  if (s.requiresWidow) bits.push("widow only");
  return bits.join(" · ");
}

export function CreatorSchemes() {
  const { session } = useSession();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const personLevel = form.appliesTo === "MEMBER";

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
      const household = form.appliesTo === "FAMILY";
      const doc = await api("/schemes", {
        method: "POST",
        session,
        body: {
          name: form.name,
          summary: form.summary,
          domain: form.domain,
          appliesTo: form.appliesTo,
          ageMin: household || form.ageMin === "" ? null : Number(form.ageMin),
          ageMax: household || form.ageMax === "" ? null : Number(form.ageMax),
          gender: household ? "ANY" : form.gender,
          requiresWidow: household ? false : form.requiresWidow
        }
      });
      setInfo(
        `Scheme announced: ${doc.schemeId}. Desk login ${doc.officer?.username} / ${doc.officer?.password} — also listed on the login page.`
      );
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
        <p className="lead">
          Same idea as a government gazette notice: name the scheme, name the department, say who may take the benefit.
          Person rules (age, gender, widow) appear only when the benefit is for one member, not the whole house.
        </p>
        <Banner error={error} info={info} />
        <form onSubmit={create}>
          <div className="form-section">
            <h3>1. What is being announced</h3>
            <Field label="Scheme name" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Old-age Pension" />
            </Field>
            <Field label="What the citizen gets">
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="One or two lines. Example: Monthly pension for a living member aged 60 or above."
              />
            </Field>
            <Field label="Department" required>
              <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                {DEPARTMENTS.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="form-section">
            <h3>2. Who may apply</h3>
            <Field label="Benefit is for" required>
              <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value, requiresWidow: false })}>
                <option value="FAMILY">Whole household (one application for the Family ID)</option>
                <option value="MEMBER">One person in the household (pick a Member ID)</option>
              </select>
            </Field>
            {personLevel ? (
              <div className="grid-2">
                <Field label="Gender">
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="ANY">Any</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </Field>
                <Field label="Must be a widow">
                  <select
                    value={String(form.requiresWidow)}
                    onChange={(e) => setForm({ ...form, requiresWidow: e.target.value === "true" })}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </Field>
                <Field label="Minimum age (years)">
                  <input type="number" min="0" placeholder="Leave blank if none" value={form.ageMin} onChange={(e) => setForm({ ...form, ageMin: e.target.value })} />
                </Field>
                <Field label="Maximum age (years)">
                  <input type="number" min="0" placeholder="Leave blank if none" value={form.ageMax} onChange={(e) => setForm({ ...form, ageMax: e.target.value })} />
                </Field>
              </div>
            ) : (
              <p className="notice">Household schemes (like ration) do not use age, gender, or widow rules. Eligibility is the Family ID itself.</p>
            )}
          </div>

          <div className="actions">
            <button className="primary" type="submit">Publish scheme</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Announced schemes</h2>
        <table>
          <thead>
            <tr>
              <th>Scheme</th>
              <th>Department</th>
              <th>Who</th>
              <th>Eligibility</th>
              <th>Scheme desk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.schemeId}>
                <td>
                  <strong>{s.name}</strong>
                  <div className="id">{s.schemeId}</div>
                  {s.summary ? <div className="notice">{s.summary}</div> : null}
                </td>
                <td>{DEPT_LABEL[s.domain] || s.domain}</td>
                <td>{whoLabel(s.appliesTo)}</td>
                <td>{criteriaText(s)}</td>
                <td>
                  {s.officer ? (
                    <>
                      <div className="id">{s.officer.username}</div>
                      <div className="id">{s.officer.password}</div>
                    </>
                  ) : (
                    "—"
                  )}
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

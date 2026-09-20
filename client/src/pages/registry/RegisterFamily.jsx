import { useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";

const empty = {
  village: "Kudasan",
  taluka: "Gandhinagar",
  district: "Gandhinagar",
  contactPhone: "",
  headName: "",
  headGender: "M",
  headDob: "",
  proofNote: "",
  password: ""
};

export function RegisterFamily() {
  const { session } = useSession();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const result = await api("/register/families", {
        method: "POST",
        session,
        body: {
          village: form.village,
          taluka: form.taluka,
          district: form.district,
          contactPhone: form.contactPhone,
          proofNote: form.proofNote,
          password: form.password,
          head: {
            fullName: form.headName,
            gender: form.headGender,
            dob: form.headDob,
            maritalStatus: "UNMARRIED"
          }
        }
      });
      setInfo(`Registered ${result.familyId}. Head member ${result.headMemberId}. Give the Family ID and login password to the head.`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Walk-in: register new family</h2>
      <p className="lead">Physical proofs stay at the counter. Only a typed proof note is stored.</p>
      <Banner error={error} info={info} />
      <form onSubmit={submit}>
        <div className="grid-3">
          <Field label="Village" required>
            <input value={form.village} onChange={(e) => set("village", e.target.value)} />
          </Field>
          <Field label="Taluka" required>
            <input value={form.taluka} onChange={(e) => set("taluka", e.target.value)} />
          </Field>
          <Field label="District" required>
            <input value={form.district} onChange={(e) => set("district", e.target.value)} />
          </Field>
        </div>
        <div className="grid-3" style={{ marginTop: 12 }}>
          <Field label="Head full name" required>
            <input value={form.headName} onChange={(e) => set("headName", e.target.value)} />
          </Field>
          <Field label="Gender" required>
            <select value={form.headGender} onChange={(e) => set("headGender", e.target.value)}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Date of birth" required>
            <input type="date" value={form.headDob} onChange={(e) => set("headDob", e.target.value)} />
          </Field>
        </div>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <Field label="Contact phone">
            <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
          <Field label="Proof note" required>
            <textarea value={form.proofNote} onChange={(e) => set("proofNote", e.target.value)} placeholder="What was seen at the counter" />
          </Field>
          <Field label="Head login password" required>
            <input
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min 8 characters. Stored hashed."
            />
          </Field>
        </div>
        <div className="actions">
          <button className="primary" type="submit">Issue Family ID</button>
        </div>
      </form>
    </div>
  );
}

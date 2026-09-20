import { useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";

const PATEL = "GJ-F-48291753-6";

export function RegistryMutations() {
  const { session } = useSession();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [birth, setBirth] = useState({
    familyId: PATEL,
    fullName: "",
    gender: "M",
    dob: "",
    fatherMemberId: "GJ-M-1001001003-3",
    proofNote: "Birth certificate seen"
  });
  const [wife, setWife] = useState({
    toFamilyId: PATEL,
    husbandMemberId: "GJ-M-1001001003-3",
    fullName: "",
    dob: "",
    proofNote: "Marriage certificate seen"
  });
  const [out, setOut] = useState({
    fromFamilyId: PATEL,
    toFamilyId: "GJ-F-61002847-3",
    memberId: "GJ-M-1001001005-5",
    spouseOfMemberId: "GJ-M-2002002002-3",
    proofNote: "Marriage certificate seen"
  });
  const [death, setDeath] = useState({
    familyId: PATEL,
    memberId: "GJ-M-1001001001-1",
    deathDate: "",
    proofNote: "Death certificate seen"
  });

  async function run(label, fn) {
    setError("");
    setInfo("");
    try {
      const result = await fn();
      setInfo(`${label}: ${JSON.stringify(result)}`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <Banner error={error} info={info} />
      <div className="card">
        <h2>Add birth</h2>
        <p className="lead">New Member ID. Membership openedHow = BIRTH. Father must be ACTIVE here.</p>
        <div className="grid-2">
          <Field label="Family ID"><input value={birth.familyId} onChange={(e) => setBirth({ ...birth, familyId: e.target.value })} /></Field>
          <Field label="Father Member ID"><input value={birth.fatherMemberId} onChange={(e) => setBirth({ ...birth, fatherMemberId: e.target.value })} /></Field>
          <Field label="Child name"><input value={birth.fullName} onChange={(e) => setBirth({ ...birth, fullName: e.target.value })} /></Field>
          <Field label="DOB"><input type="date" value={birth.dob} onChange={(e) => setBirth({ ...birth, dob: e.target.value })} /></Field>
        </div>
        <div className="actions">
          <button
            className="primary"
            onClick={() =>
              run("Birth", () =>
                api(`/register/families/${encodeURIComponent(birth.familyId)}/births`, {
                  method: "POST",
                  session,
                  body: birth
                })
              )
            }
          >
            Commit birth
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Son marries in-house (joint family)</h2>
        <p className="lead">New wife joins this Family ID. openedHow = MARRIAGE_IN. Son stays.</p>
        <div className="grid-2">
          <Field label="Family ID"><input value={wife.toFamilyId} onChange={(e) => setWife({ ...wife, toFamilyId: e.target.value })} /></Field>
          <Field label="Husband Member ID"><input value={wife.husbandMemberId} onChange={(e) => setWife({ ...wife, husbandMemberId: e.target.value })} /></Field>
          <Field label="Wife name"><input value={wife.fullName} onChange={(e) => setWife({ ...wife, fullName: e.target.value })} /></Field>
          <Field label="Wife DOB"><input type="date" value={wife.dob} onChange={(e) => setWife({ ...wife, dob: e.target.value })} /></Field>
          <Field label="Proof note"><input value={wife.proofNote} onChange={(e) => setWife({ ...wife, proofNote: e.target.value })} /></Field>
        </div>
        <div className="actions">
          <button
            className="primary"
            onClick={() =>
              run("Wife in", () =>
                api("/register/marriages", {
                  method: "POST",
                  session,
                  body: {
                    toFamilyId: wife.toFamilyId,
                    spouseOfMemberId: wife.husbandMemberId,
                    fullName: wife.fullName,
                    dob: wife.dob,
                    proofNote: wife.proofNote
                  }
                })
              )
            }
          >
            Commit marriage-in
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Daughter marries out</h2>
        <p className="lead">Natal membership LEFT / MARRIAGE_OUT. Same Member ID becomes ACTIVE in husband’s house.</p>
        <div className="grid-2">
          <Field label="From Family ID"><input value={out.fromFamilyId} onChange={(e) => setOut({ ...out, fromFamilyId: e.target.value })} /></Field>
          <Field label="To Family ID"><input value={out.toFamilyId} onChange={(e) => setOut({ ...out, toFamilyId: e.target.value })} /></Field>
          <Field label="Daughter Member ID"><input value={out.memberId} onChange={(e) => setOut({ ...out, memberId: e.target.value })} /></Field>
          <Field label="Husband Member ID"><input value={out.spouseOfMemberId} onChange={(e) => setOut({ ...out, spouseOfMemberId: e.target.value })} /></Field>
        </div>
        <div className="actions">
          <button
            className="primary"
            onClick={() =>
              run("Marry out", () =>
                api("/register/marriages", { method: "POST", session, body: out })
              )
            }
          >
            Commit marriage-out
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Record death</h2>
        <p className="lead">If the deceased is head, Family ID stays. Eldest living son becomes head.</p>
        <div className="grid-2">
          <Field label="Family ID"><input value={death.familyId} onChange={(e) => setDeath({ ...death, familyId: e.target.value })} /></Field>
          <Field label="Member ID"><input value={death.memberId} onChange={(e) => setDeath({ ...death, memberId: e.target.value })} /></Field>
          <Field label="Death date"><input type="date" value={death.deathDate} onChange={(e) => setDeath({ ...death, deathDate: e.target.value })} /></Field>
          <Field label="Proof note"><input value={death.proofNote} onChange={(e) => setDeath({ ...death, proofNote: e.target.value })} /></Field>
        </div>
        <div className="actions">
          <button
            className="danger"
            onClick={() =>
              run("Death", () => api("/register/deaths", { method: "POST", session, body: death }))
            }
          >
            Commit death
          </button>
        </div>
      </div>
    </>
  );
}

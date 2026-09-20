import { useState } from "react";
import { api } from "../../api/http.js";
import { useSession } from "../../session/SessionContext.jsx";
import { Banner, Field } from "../../components/Field.jsx";

const PATEL = "GJ-F-48291753";

export function RegistryMutations() {
  const { session } = useSession();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [birth, setBirth] = useState({
    familyId: PATEL,
    fullName: "",
    gender: "M",
    dob: "",
    fatherMemberId: "GJ-M-1001001003",
    proofNote: "Birth certificate seen"
  });
  const [wife, setWife] = useState({
    toFamilyId: PATEL,
    husbandMemberId: "GJ-M-1001001003",
    wifeMemberId: "",
    proofNote: "Marriage certificate seen"
  });
  const [wifeHint, setWifeHint] = useState("");
  const [death, setDeath] = useState({
    familyId: PATEL,
    memberId: "GJ-M-1001001001",
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
        <h2>Record marriage</h2>
        <p className="lead">
          One event. The wife is identified by Member ID. That ID leaves her father’s house (LEFT / MARRIAGE_OUT)
          and joins the husband’s Family ID (ACTIVE / MARRIAGE_IN). The son stays. No second form is needed.
        </p>
        <div className="grid-2">
          <Field label="Husband&apos;s Family ID" required>
            <input value={wife.toFamilyId} onChange={(e) => setWife({ ...wife, toFamilyId: e.target.value })} />
          </Field>
          <Field label="Husband Member ID" required>
            <input value={wife.husbandMemberId} onChange={(e) => setWife({ ...wife, husbandMemberId: e.target.value })} />
          </Field>
          <Field label="Wife Member ID" required>
            <input
              value={wife.wifeMemberId}
              onChange={(e) => { setWifeHint(""); setWife({ ...wife, wifeMemberId: e.target.value }); }}
              placeholder="GJ-M-…"
            />
          </Field>
          <Field label="Proof note" required>
            <input value={wife.proofNote} onChange={(e) => setWife({ ...wife, proofNote: e.target.value })} />
          </Field>
        </div>
        {wifeHint ? <p className="notice">{wifeHint}</p> : null}
        <div className="actions">
          <button
            className="ghost"
            type="button"
            onClick={() =>
              run("Check wife", async () => {
                const id = wife.wifeMemberId.trim();
                if (!id) throw new Error("Wife Member ID required");
                const hits = await api(`/register/lookup?q=${encodeURIComponent(id)}`, { session });
                if (!hits.length) throw new Error("No ACTIVE household for that Member ID");
                const dossier = await api(`/register/families/${encodeURIComponent(hits[0].familyId)}`, { session });
                const row = dossier.members.find((m) => m.memberId === id && m.status === "ACTIVE");
                const name = row?.member?.fullName || "Unknown";
                setWifeHint(`${name} · now in ${hits[0].familyId} (${hits[0].village})`);
                return { memberId: id, fullName: name, familyId: hits[0].familyId };
              })
            }
          >
            Check Member ID
          </button>
          <button
            className="primary"
            onClick={() =>
              run("Marriage", () =>
                api("/register/marriages", {
                  method: "POST",
                  session,
                  body: {
                    toFamilyId: wife.toFamilyId,
                    spouseOfMemberId: wife.husbandMemberId,
                    wifeMemberId: wife.wifeMemberId.trim(),
                    proofNote: wife.proofNote
                  }
                })
              )
            }
          >
            Commit marriage
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

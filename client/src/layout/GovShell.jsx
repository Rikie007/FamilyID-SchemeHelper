import { useSession } from "../session/SessionContext.jsx";

const NAV = {
  HEAD: [
    ["family", "કુટુંબ / My family"],
    ["schemes", "યોજના / Schemes"],
    ["apps", "અરજી / Applications"]
  ],
  REGISTRY: [
    ["lookup", "Lookup"],
    ["register", "New family"],
    ["mutate", "Life events"]
  ],
  SCHEME_CREATOR: [["schemes", "Announce schemes"]],
  SCHEME_OFFICER: [
    ["inbox", "Application inbox"],
    ["ben", "Beneficiaries"],
    ["lookup", "Family verify"]
  ]
};

export function GovShell({ page, setPage, children }) {
  const { session, changeRole, setFamilyId, setOfficerId } = useSession();
  const items = NAV[session.role] || [];

  return (
    <>
      <div className="tricolor">
        <span className="saffron" />
        <span className="white" />
        <span className="green" />
      </div>
      <header className="topbar">
        <div className="brand">
          <strong>Gujarat Family ID</strong>
          <small>Citizen services · Beneficiary &amp; scheme desk · Prototype</small>
        </div>
        <div className="role-box">
          <label>
            Role
            <select value={session.role} onChange={(e) => { changeRole(e.target.value); setPage(NAV[e.target.value][0][0]); }}>
              <option value="HEAD">Family Head</option>
              <option value="REGISTRY">Registry Officer</option>
              <option value="SCHEME_CREATOR">Scheme Creator</option>
              <option value="SCHEME_OFFICER">Scheme Officer</option>
            </select>
          </label>
          {session.role === "HEAD" ? (
            <label>
              Family ID
              <input value={session.familyId} onChange={(e) => setFamilyId(e.target.value.trim())} />
            </label>
          ) : (
            <label>
              Officer ID
              <input value={session.officerId} onChange={(e) => setOfficerId(e.target.value.trim())} />
            </label>
          )}
        </div>
      </header>
      <nav className="nav">
        {items.map(([id, label]) => (
          <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
            {label}
          </button>
        ))}
      </nav>
      <main className="wrap">{children}</main>
      <footer className="footer">
        Government of Gujarat · Family ID register (prototype). Not an official portal. No Ashoka emblem. IDs are not Aadhaar.
      </footer>
    </>
  );
}

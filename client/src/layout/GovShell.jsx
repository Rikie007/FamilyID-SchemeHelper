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
    ["overview", "Desk analysis"],
    ["inbox", "Application inbox"],
    ["ben", "Taking the benefit"],
    ["lookup", "Family verify"]
  ]
};

const ROLE_LABEL = {
  HEAD: "Family Head",
  REGISTRY: "Registry Officer",
  SCHEME_CREATOR: "Scheme Creator",
  SCHEME_OFFICER: "Scheme Officer"
};

function deskLine(session) {
  if (session.role === "SCHEME_OFFICER" && session.schemeId) {
    return `Scheme Officer · ${session.schemeId}`;
  }
  if (session.role === "SCHEME_OFFICER") {
    return "Scheme Manager · all schemes";
  }
  return `${ROLE_LABEL[session.role] || session.role}${session.familyId ? ` · ${session.familyId}` : ""}`;
}

export function GovShell({ page, setPage, children }) {
  const { session, logout } = useSession();
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
        <div className="signed-in">
          <div className="who">
            <strong>{session.displayName}</strong>
            <span>{deskLine(session)}</span>
          </div>
          <button className="ghost" type="button" onClick={logout}>
            Sign out
          </button>
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

export { NAV };

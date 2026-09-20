import { createContext, useContext, useMemo, useState } from "react";

const SessionContext = createContext(null);

const DEFAULTS = {
  HEAD: { familyId: "GJ-F-48291753-6", officerId: "" },
  REGISTRY: { familyId: "", officerId: "REG-1" },
  SCHEME_CREATOR: { familyId: "", officerId: "CRE-1" },
  SCHEME_OFFICER: { familyId: "", officerId: "SO-1" }
};

export function SessionProvider({ children }) {
  const [role, setRole] = useState("HEAD");
  const [familyId, setFamilyId] = useState(DEFAULTS.HEAD.familyId);
  const [officerId, setOfficerId] = useState("");

  function changeRole(next) {
    setRole(next);
    setFamilyId(DEFAULTS[next].familyId);
    setOfficerId(DEFAULTS[next].officerId);
  }

  const session = useMemo(() => ({ role, familyId, officerId }), [role, familyId, officerId]);

  return (
    <SessionContext.Provider value={{ session, setFamilyId, setOfficerId, changeRole }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

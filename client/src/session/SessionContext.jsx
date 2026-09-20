import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "gj-family-session";
const SessionContext = createContext(null);

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readStored());

  const value = useMemo(() => {
    function login(next) {
      setSession(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    function logout() {
      setSession(null);
      sessionStorage.removeItem(STORAGE_KEY);
    }

    return { session, login, logout };
  }, [session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

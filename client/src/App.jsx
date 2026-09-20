import { useEffect, useState } from "react";
import { SessionProvider, useSession } from "./session/SessionContext.jsx";
import { GovShell, NAV } from "./layout/GovShell.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { HeadFamily } from "./pages/head/HeadFamily.jsx";
import { HeadSchemes } from "./pages/head/HeadSchemes.jsx";
import { HeadApplications } from "./pages/head/HeadApplications.jsx";
import { RegistryLookup } from "./pages/registry/RegistryLookup.jsx";
import { RegisterFamily } from "./pages/registry/RegisterFamily.jsx";
import { RegistryMutations } from "./pages/registry/RegistryMutations.jsx";
import { CreatorSchemes } from "./pages/creator/CreatorSchemes.jsx";
import { OfficerInbox, OfficerBeneficiaries } from "./pages/officer/OfficerDesk.jsx";

function firstPage(role) {
  return (NAV[role] && NAV[role][0][0]) || "family";
}

function Screen() {
  const { session } = useSession();
  const [page, setPage] = useState(() => firstPage(session?.role));

  useEffect(() => {
    if (session?.role) setPage(firstPage(session.role));
  }, [session?.role]);

  if (!session) return <LoginPage />;

  let body = null;
  if (session.role === "HEAD") {
    if (page === "schemes") body = <HeadSchemes />;
    else if (page === "apps") body = <HeadApplications />;
    else body = <HeadFamily />;
  } else if (session.role === "REGISTRY") {
    if (page === "register") body = <RegisterFamily />;
    else if (page === "mutate") body = <RegistryMutations />;
    else body = <RegistryLookup />;
  } else if (session.role === "SCHEME_CREATOR") {
    body = <CreatorSchemes />;
  } else if (page === "ben") body = <OfficerBeneficiaries />;
  else if (page === "lookup") body = <RegistryLookup />;
  else body = <OfficerInbox />;

  return (
    <GovShell page={page} setPage={setPage}>
      {body}
    </GovShell>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Screen />
    </SessionProvider>
  );
}

export function Lifecycle({ steps }) {
  if (!steps?.length) return null;
  return (
    <ol className="life">
      {steps.map((s) => (
        <li key={s.key} className={`life-step ${s.state}`}>
          <strong>{s.label}</strong>
          <em>{s.at || (s.state === "current" ? "Now" : s.state === "wait" ? "Not yet" : "—")}</em>
          {s.note ? <span className="notice">{s.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}

export function StatCards({ totals }) {
  if (!totals) return null;
  return (
    <div className="stat-grid">
      <div className="stat">
        <b>{totals.applications}</b>
        <span>Applications</span>
      </div>
      <div className="stat warn">
        <b>{totals.pending}</b>
        <span>Pending</span>
      </div>
      <div className="stat ok">
        <b>{totals.approved}</b>
        <span>Approved</span>
      </div>
      <div className="stat bad">
        <b>{totals.rejected}</b>
        <span>Rejected</span>
      </div>
      <div className="stat ok">
        <b>{totals.receiving}</b>
        <span>Receiving benefit</span>
      </div>
    </div>
  );
}

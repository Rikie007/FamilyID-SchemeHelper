const MAP = {
  ACTIVE: "ok",
  OPEN: "ok",
  APPROVED: "ok",
  Eligible: "ok",
  PENDING: "warn",
  LEFT: "idle",
  REJECTED: "bad",
  NotEligible: "bad",
  AlreadyReceiving: "warn",
  CLOSED: "idle",
  ENDED: "idle"
};

export function StatusChip({ value }) {
  const kind = MAP[value] || "idle";
  return <span className={`chip ${kind}`}>{value}</span>;
}

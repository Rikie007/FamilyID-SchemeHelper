export function Field({ label, required, children }) {
  return (
    <label className="field">
      <span>
        {label} {required ? <span className="req">*</span> : null}
      </span>
      {children}
    </label>
  );
}

export function Banner({ error, info }) {
  if (error) return <div className="banner err">{error}</div>;
  if (info) return <div className="banner info">{info}</div>;
  return null;
}

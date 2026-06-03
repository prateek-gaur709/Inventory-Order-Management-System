export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="banner banner-error">{message}</div>;
}

export function Loading({ label = 'Loading…' }) {
  return <div className="state-msg">{label}</div>;
}

export function Empty({ label = 'Nothing here yet.' }) {
  return <div className="state-msg state-empty">{label}</div>;
}

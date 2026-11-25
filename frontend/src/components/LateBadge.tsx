export function LateBadge({ label = "Late" }: { label?: string }) {
  return <span className="badge badge-late">{label}</span>;
}

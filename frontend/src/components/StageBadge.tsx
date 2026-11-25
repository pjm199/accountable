import { STAGE_BY_ID } from "../lib/rules";
import type { Stage } from "../lib/types";

/** The stage colour as a dot, always with the stage name. */
export function StageBadge({ stage }: { stage: Stage }) {
  const info = STAGE_BY_ID[stage];
  return (
    <span className="stage-badge">
      <i style={{ background: info.color }} aria-hidden />
      {info.label}
    </span>
  );
}

import { money, moneyShort } from "../lib/format";

export function Money({ cents, short = false }: { cents: number; short?: boolean }) {
  return <span className="mono">{short ? moneyShort(cents) : money(cents)}</span>;
}

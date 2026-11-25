import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, moneyShort } from "../../lib/format";
import { STAGE_BY_ID } from "../../lib/rules";
import type { Dashboard } from "../../lib/types";

const INK_SOFT = "rgba(7, 59, 76, 0.65)";
const GRID = "rgba(7, 59, 76, 0.08)";
const AXIS = { fontFamily: "JetBrains Mono, monospace", fontSize: 11, fill: INK_SOFT };
const TOOLTIP = {
  contentStyle: { borderRadius: 12, border: 0, boxShadow: "0 8px 24px rgba(7,59,76,.15)", fontFamily: "Instrument Sans, sans-serif" },
  labelStyle: { fontWeight: 600, color: "#073B4C" },
};

/** Revenue won per month by close date, last 12 months (R34). */
export function RevenueChart({ months }: { months: Dashboard["months"] }) {
  const data = months.map((m) => ({ label: m.label, value: m.won_cents }));
  return (
    <section className="panel chart-panel" aria-labelledby="revenue-title">
      <h2 id="revenue-title" className="panel-title">Revenue won</h2>
      <p className="panel-hint">By month of close date, last 12 months</p>
      <div className="chart" role="img" aria-label={`Revenue won by month: ${data.map((d) => `${d.label} ${moneyShort(d.value)}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#118AB2" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#118AB2" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={64} tickFormatter={(v: number) => moneyShort(v)} />
            <Tooltip {...TOOLTIP} formatter={(v) => [money(Number(v)), "Won"]} />
            <Area type="monotone" dataKey="value" stroke="#118AB2" strokeWidth={2.5} fill="url(#revenueFill)" dot={{ r: 3, fill: "#fff", stroke: "#118AB2", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** Number of deals won per month, same 12 months (R35). */
export function WinsChart({ months }: { months: Dashboard["months"] }) {
  const data = months.map((m) => ({ label: m.label, count: m.won_count }));
  return (
    <section className="panel chart-panel" aria-labelledby="wins-title">
      <h2 id="wins-title" className="panel-title">Deals won</h2>
      <p className="panel-hint">Number of deals by month</p>
      <div className="chart" role="img" aria-label={`Deals won by month: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
            <Tooltip {...TOOLTIP} cursor={{ fill: "rgba(7,59,76,.04)" }} formatter={(v) => [String(v), "Deals won"]} />
            <Bar dataKey="count" fill="#FFC145" radius={[6, 6, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="count" position="top" style={{ ...AXIS, fill: "#073B4C" }} formatter={(v: unknown) => (Number(v) ? String(v) : "")} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** Open value by stage (R36). */
export function PipelineDonut({ data }: { data: Dashboard }) {
  const slices = data.open_by_stage.map((s) => ({ ...s, info: STAGE_BY_ID[s.stage] }));
  return (
    <section className="panel chart-panel" aria-labelledby="donut-title">
      <h2 id="donut-title" className="panel-title">Open pipeline</h2>
      <p className="panel-hint">Value by stage</p>
      <div className="donut-wrap">
        <div className="donut" role="img" aria-label={`Open pipeline ${moneyShort(data.open_value_cents)}: ${slices.map((s) => `${s.info.label} ${moneyShort(s.value_cents)}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={slices} dataKey="value_cents" nameKey="stage" innerRadius={68} outerRadius={96} paddingAngle={2} cornerRadius={4} stroke="none" startAngle={90} endAngle={-270}>
                {slices.map((s) => (
                  <Cell key={s.stage} fill={s.info.color.startsWith("var") ? HEX[s.stage] : s.info.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <b className="mono">{moneyShort(data.open_value_cents)}</b>
            <span>open</span>
          </div>
        </div>
        <ul className="legend">
          {slices.map((s) => (
            <li key={s.stage}>
              <span>
                <i style={{ background: s.info.color }} aria-hidden />
                {s.info.label}
              </span>
              <b className="mono">{moneyShort(s.value_cents)}</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// SVG fills can't read CSS variables in every browser, so the chart uses the values.
export const HEX: Record<string, string> = {
  new: "#06D6A0",
  qualified: "#FFC145",
  proposal: "#F78C6B",
  negotiation: "#118AB2",
  won: "#073B4C",
  lost: "#EF476F",
};

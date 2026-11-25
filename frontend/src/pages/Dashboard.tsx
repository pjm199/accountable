import { LoadError, Loading } from "../components/PageHeader";
import { useDashboard } from "../hooks/dashboard";
import { PipelineDonut, RevenueChart, WinsChart } from "./dashboard/Charts";
import { Funnel } from "./dashboard/Funnel";
import { Greeting } from "./dashboard/Greeting";
import { RecentActivity } from "./dashboard/RecentActivity";
import { SummaryPanel } from "./dashboard/SummaryPanel";
import "./dashboard/dashboard.css";

export default function Dashboard() {
  const { data, isPending, error } = useDashboard();
  if (isPending) return <main className="page"><Loading /></main>;
  if (error || !data) return <main className="page"><LoadError error={error} /></main>;
  return (
    <main className="page">
      <Greeting data={data} />
      <div className="dash-grid">
        <SummaryPanel data={data} />
        <RevenueChart months={data.months} />
        <WinsChart months={data.months} />
        <PipelineDonut data={data} />
        <Funnel stages={data.funnel} />
        <RecentActivity entries={data.recent} />
      </div>
    </main>
  );
}

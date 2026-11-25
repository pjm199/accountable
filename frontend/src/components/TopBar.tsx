import { Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useDealForm } from "./DealFormContext";
import "./TopBar.css";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/organizations", label: "Organizations" },
  { to: "/contacts", label: "Contacts" },
  { to: "/deals", label: "Deals" },
  { to: "/pipeline", label: "Pipeline" },
];

export function TopBar() {
  const openDealForm = useDealForm();
  return (
    <header className="topbar">
      <NavLink to="/" className="wordmark" aria-label="Accountable, dashboard">
        <span className="wordmark-dot" aria-hidden />
        Accountable
      </NavLink>
      <nav className="topnav" aria-label="Main">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="topnav-link">
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button className="btn" type="button" onClick={() => openDealForm()}>
        <Plus size={16} aria-hidden /> Add deal
      </button>
    </header>
  );
}

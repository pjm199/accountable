import { Link, Route, Routes } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Organizations from "./pages/Organizations";
import Contacts from "./pages/Contacts";
import Deals from "./pages/Deals";
import OrganizationPage from "./pages/OrganizationPage";
import ContactPage from "./pages/ContactPage";
import DealPage from "./pages/DealPage";

export function NotFound() {
  return (
    <main className="page">
      <div className="panel empty">
        <h1 className="panel-title">Page not found</h1>
        <p>There is nothing at this address.</p>
        <Link className="btn" to="/">
          Go to the dashboard
        </Link>
      </div>
    </main>
  );
}

export function AppRoutes() {
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/deals/:id" element={<DealPage />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/:id" element={<ContactPage />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/organizations/:id" element={<OrganizationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

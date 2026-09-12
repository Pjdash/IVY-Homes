import { useState } from "react";
import { Route } from "react-router-dom";
import * as api from "./api";
import AppShell from "./components/AppShell";
import SessionGate from "./components/SessionGate";
import CollectionPage from "./pages/CollectionPage";
import ExplorePage from "./pages/ExplorePage";
import InsightsPage from "./pages/InsightsPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import LoginPage from "./pages/LoginPage";
import SavedPage from "./pages/SavedPage";

export default function App() {
  const [session, setSession] = useState(api.getSession());

  async function signOut() {
    await api.logout();
    setSession(null);
  }

  const pages = (
    <>
      <Route path="/" element={<ExplorePage />} />
      <Route path="/listing/:id" element={<ListingDetailPage />} />
      <Route path="/rentals" element={<CollectionPage kind="rentals" />} />
      <Route path="/projects" element={<CollectionPage kind="projects" />} />
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/insights" element={<InsightsPage />} />
    </>
  );

  return (
    <SessionGate
      session={session}
      login={<LoginPage onLogin={setSession} />}
      app={<AppShell session={session} onLogout={signOut} pages={pages} />}
    />
  );
}

import {
  BarChart3,
  Bookmark,
  Building2,
  Compass,
  House,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, Routes, useLocation } from "react-router-dom";

export default function AppShell({ session, onLogout, pages }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigation = [
    { to: "/", label: "Explore", icon: Compass },
    { to: "/rentals", label: "Rentals", icon: House },
    { to: "/projects", label: "Projects", icon: Building2 },
    { to: "/saved", label: "Saved homes", icon: Bookmark },
    { to: "/insights", label: "Insights", icon: BarChart3 },
  ];
  const current =
    navigation.find((item) => item.to === location.pathname)?.label ||
    "Property detail";
  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">i</span>
          <span>
            Ivy<span className="muted">/homes</span>
          </span>
          <button
            className="icon-button mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="city-pill">
          <span className="pulse" /> Your city feed is live
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={location.pathname === to ? "active" : ""}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">
              {session.user?.name?.slice(0, 1) || "D"}
            </div>
            <div>
              <strong>{session.user?.name || "Demo User"}</strong>
              <small>{session.user?.email}</small>
            </div>
          </div>
          <button className="logout" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="crumb">
            Ivy Homes <span>/</span> {current}
          </div>
          <div className="top-actions">
            <span className="secure">
              <span className="secure-dot" /> Connected securely
            </span>
            <div className="avatar small">
              {session.user?.name?.slice(0, 1) || "D"}
            </div>
          </div>
        </header>
        <div className="page">
          <Routes>{pages}</Routes>
        </div>
      </main>
    </div>
  );
}

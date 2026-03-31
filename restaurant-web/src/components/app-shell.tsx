import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", note: "Overview" },
  { to: "/orders", label: "Orders", note: "Live inbox" },
  { to: "/restaurant", label: "Restaurant", note: "Profile" },
  { to: "/menu", label: "Menu", note: "Items" },
  { to: "/offers", label: "Offers", note: "Campaigns" },
];

export function AppShell() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">Restaurant owner</p>
          <h1 className="brand-title">Foodpand Studio</h1>
          <p className="sidebar-copy">
            Manage menu, offers, and live order flow from one tidy workspace.
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              <span className="nav-label">{item.label}</span>
              <span className="nav-note">{item.note}</span>
            </NavLink>
          ))}
        </nav>

        <div className="owner-card">
          <div className="owner-avatar">{user?.name?.slice(0, 1) || "O"}</div>
          <div>
            <p className="owner-name">{user?.name}</p>
            <p className="owner-email">{user?.email}</p>
          </div>
          <button className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Owner workspace</p>
            <h2 className="page-title">
              {navItems.find((item) => item.to === pathname)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="topbar-badge">
            <span className="status-dot" />
            Backend connected
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

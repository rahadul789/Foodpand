import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../lib/auth";
import {
  useMarkAllOwnerNotificationsReadMutation,
  useMarkOwnerNotificationReadMutation,
  useOwnerNotificationsQuery,
} from "../lib/notification-queries";
import { disconnectOwnerSocket, getOwnerSocket } from "../lib/socket";

type NavItem = {
  to: string;
  label: string;
  note: string;
  icon: "dashboard" | "orders" | "restaurant" | "menu" | "offers";
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", note: "Overview", icon: "dashboard" },
  { to: "/orders", label: "Orders", note: "Live inbox", icon: "orders" },
  { to: "/restaurant", label: "Restaurant", note: "Profile", icon: "restaurant" },
  { to: "/menu", label: "Menu", note: "Items", icon: "menu" },
  { to: "/offers", label: "Offers", note: "Campaigns", icon: "offers" },
];

function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NavGlyph({ kind }: { kind: NavItem["icon"] }) {
  const paths = {
    dashboard: "M3 4h8v7H3z M13 4h8v4h-8z M13 10h8v11h-8z M3 13h8v8H3z",
    orders: "M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5",
    restaurant: "M6 7c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v10c0 2.2-1.8 4-4 4h-4c-2.2 0-4-1.8-4-4z M9 8h6",
    menu: "M6 5h12 M6 10h12 M6 15h8 M4 5h.01 M4 10h.01 M4 15h.01",
    offers: "M7 5h8l4 4-8 8-4-4z M11 9h.01",
  } as const;

  return (
    <svg viewBox="0 0 24 24" className="nav-icon" aria-hidden="true">
      <path
        d={paths[kind]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="topbar-icon" aria-hidden="true">
      <path
        d="M6.5 16.5h11l-1.3-1.8V10a4.2 4.2 0 0 0-8.4 0v4.7z M10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token, logout } = useAuth();
  const { data: notificationsData } = useOwnerNotificationsQuery();
  const markReadMutation = useMarkOwnerNotificationReadMutation();
  const markAllReadMutation = useMarkAllOwnerNotificationsReadMutation();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = getOwnerSocket(token);
    const handleOwnerOrderChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ["owner", "notifications"] });
    };

    socket.on("owner:orders:changed", handleOwnerOrderChanged);

    return () => {
      socket.off("owner:orders:changed", handleOwnerOrderChanged);
      disconnectOwnerSocket();
    };
  }, [queryClient, token]);

  useEffect(() => {
    if (!notificationOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationPanelRef.current) {
        return;
      }

      if (!notificationPanelRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [notificationOpen]);

  const pageMeta = useMemo(
    () => navItems.find((item) => item.to === pathname) ?? navItems[0],
    [pathname],
  );
  const recentNotifications = notificationsData?.notifications.slice(0, 8) ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  const handleOpenNotification = async (notificationId: string, target?: string) => {
    await markReadMutation.mutateAsync(notificationId);
    setNotificationOpen(false);

    if (target === "orders") {
      navigate("/orders");
    }
  };

  return (
    <div className="shell shell-elevated">
      <aside className="sidebar sidebar-dark">
        <div className="brand-card brand-card-dark">
          <p className="eyebrow">Restaurant owner workspace</p>
          <h1 className="brand-title">Foodbela Studio</h1>
          <p className="sidebar-copy sidebar-copy-soft">
            Orders, menu, campaigns, and handoff flow in one clearer control room.
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-pro nav-link-active" : "nav-link nav-link-pro"
              }
            >
              <div className="nav-icon-wrap">
                <NavGlyph kind={item.icon} />
              </div>
              <div className="nav-copy">
                <span className="nav-label">{item.label}</span>
                <span className="nav-note">{item.note}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="owner-card owner-card-dark">
          <div className="owner-avatar">{user?.name?.slice(0, 1) || "O"}</div>
          <div>
            <p className="owner-name">{user?.name}</p>
            <p className="owner-email">{user?.email}</p>
          </div>
          <button className="ghost-button ghost-button-dark" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel main-panel-rich">
        <header className="topbar topbar-rich">
          <div>
            <p className="eyebrow">Owner workspace</p>
            <h2 className="page-title">{pageMeta.label}</h2>
            <p className="topbar-subtitle">
              {pageMeta.label === "Dashboard"
                ? "Keep the team aligned with live orders, setup, and campaigns."
                : pageMeta.label === "Orders"
                  ? "Handle new orders, kitchen preparation, and rider handoff."
                  : pageMeta.label === "Restaurant"
                    ? "Shape how the restaurant appears across the customer experience."
                    : pageMeta.label === "Menu"
                      ? "Structure products, variants, and extras without clutter."
                      : "Keep promotions tidy, trackable, and easy to manage."}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="topbar-badge topbar-badge-rich">
              <span className="status-dot" />
              Backend connected
            </div>

            <div className="notification-shell" ref={notificationPanelRef}>
              <button
                className="icon-surface-button"
                type="button"
                onClick={() => setNotificationOpen((current) => !current)}
              >
                <BellIcon />
                {unreadCount > 0 ? (
                  <span className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationOpen ? (
                <div className="notification-panel">
                  <div className="notification-panel-top">
                    <div>
                      <p className="eyebrow">Notifications</p>
                      <h3>Recent updates</h3>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      disabled={unreadCount === 0 || markAllReadMutation.isPending}
                      onClick={() => void markAllReadMutation.mutateAsync()}
                    >
                      Mark all read
                    </button>
                  </div>

                  {recentNotifications.length === 0 ? (
                    <div className="empty-state">
                      <strong>No notifications yet</strong>
                      <p className="muted">
                        New orders and delivery updates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="notification-list">
                      {recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          className={
                            notification.unread
                              ? "notification-card notification-card-unread"
                              : "notification-card"
                          }
                          type="button"
                          onClick={() =>
                            void handleOpenNotification(
                              notification.id,
                              notification.target,
                            )
                          }
                        >
                          <div className="notification-card-top">
                            <strong>{notification.title}</strong>
                            {notification.unread ? <span className="status-pill">New</span> : null}
                          </div>
                          <p className="muted-small">{notification.body}</p>
                          <span className="notification-time">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

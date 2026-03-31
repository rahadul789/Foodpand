import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/app-shell";
import { useAuth } from "./lib/auth";
import { DashboardPage } from "./pages/dashboard-page";
import { LoginPage } from "./pages/login-page";
import { MenuPage } from "./pages/menu-page";
import { OffersPage } from "./pages/offers-page";
import { OrdersPage } from "./pages/orders-page";
import { RestaurantPage } from "./pages/restaurant-page";

function ProtectedRoutes() {
  const { isHydrating, isAuthenticated } = useAuth();

  if (isHydrating) {
    return (
      <div className="app-loader">
        <div className="loader-orb" />
        <div>
          <p className="eyebrow">Restaurant panel</p>
          <h1>Preparing your workspace</h1>
          <p className="muted">
            Checking owner access and loading your restaurant dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/restaurant" element={<RestaurantPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/offers" element={<OffersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

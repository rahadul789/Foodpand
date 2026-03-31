import { CardSkeleton, StatSkeletons } from "../components/skeletons";
import { useMyRestaurantQuery, useOwnerInboxQuery } from "../lib/owner-queries";

function formatTaka(value: number) {
  return `TK ${Math.round(value)}`;
}

export function DashboardPage() {
  const {
    data: restaurant,
    isLoading: restaurantLoading,
    error: restaurantError,
  } = useMyRestaurantQuery();
  const { data: orders = [], isLoading: ordersLoading } = useOwnerInboxQuery();

  const pendingCount = orders.filter((order) => order.status === "Pending acceptance").length;
  const preparingCount = orders.filter((order) => order.status === "Preparing").length;
  const readyCount = orders.filter((order) => order.status === "Ready for pickup").length;
  const grossToday = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Today at a glance</p>
          <h3>
            {restaurant
              ? `${restaurant.name} is live and ready`
              : "Set up your restaurant to start managing live orders"}
          </h3>
          <p className="muted">
            This panel is intentionally focused on operational clarity first:
            orders, restaurant setup, menu, and offers.
          </p>
        </div>
        <div className="hero-pill">
          {restaurant ? restaurant.deliveryTime || "Owner panel active" : "Setup needed"}
        </div>
      </section>

      {restaurantLoading || ordersLoading ? (
        <StatSkeletons />
      ) : (
        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Pending acceptance</span>
            <strong className="stat-value">{pendingCount}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Preparing now</span>
            <strong className="stat-value">{preparingCount}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Ready for pickup</span>
            <strong className="stat-value">{readyCount}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Live order value</span>
            <strong className="stat-value">{formatTaka(grossToday)}</strong>
          </article>
        </section>
      )}

      <section className="grid-two">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Restaurant status</p>
              <h3>{restaurant?.name || "No restaurant created yet"}</h3>
            </div>
          </div>

          {restaurantLoading ? (
            <CardSkeleton lines={3} />
          ) : restaurant ? (
            <div className="detail-list">
              <div className="detail-row">
                <span>Cuisine</span>
                <strong>{restaurant.cuisine}</strong>
              </div>
              <div className="detail-row">
                <span>Address</span>
                <strong>{restaurant.address}</strong>
              </div>
              <div className="detail-row">
                <span>Menu items</span>
                <strong>{restaurant.menuItems.length}</strong>
              </div>
              <div className="detail-row">
                <span>Offers</span>
                <strong>{restaurant.offers.length}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Create your restaurant first</strong>
              <p className="muted">
                Your owner account can create one restaurant. After that, menu,
                offers, and live order flow will open up.
              </p>
            </div>
          )}

          {restaurantError ? (
            <p className="form-error">
              {restaurantError instanceof Error
                ? restaurantError.message
                : "Unable to load restaurant right now."}
            </p>
          ) : null}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Owner roadmap</p>
              <h3>What’s already ready</h3>
            </div>
          </div>
          <ul className="roadmap-list">
            <li>Owner-only restaurant creation with one-owner-per-restaurant rule</li>
            <li>Live order inbox with status actions</li>
            <li>Ready-for-pickup flow wired for rider handoff</li>
            <li>Menu and offer sections structured for next CRUD pass</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

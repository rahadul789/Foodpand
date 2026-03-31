import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { CardSkeleton } from "../components/skeletons";
import { useAuth } from "../lib/auth";
import {
  useMyRestaurantQuery,
  useOwnerInboxQuery,
  useOwnerOrderStatusMutation,
  useUpdatePreparationWindowMutation,
} from "../lib/owner-queries";
import { disconnectOwnerSocket, getOwnerSocket } from "../lib/socket";

const PREP_RANGE_OPTIONS = [
  { value: "10-15", label: "10-15 min" },
  { value: "15-20", label: "15-20 min" },
  { value: "20-25", label: "20-25 min" },
  { value: "25-30", label: "25-30 min" },
  { value: "30-35", label: "30-35 min" },
  { value: "35-45", label: "35-45 min" },
  { value: "45-60", label: "45-60 min" },
] as const;

function toPrepRangeValue(minMinutes?: number, maxMinutes?: number) {
  return `${minMinutes ?? 15}-${maxMinutes ?? 20}`;
}

function parsePrepRangeValue(value: string) {
  const [min, max] = value.split("-").map(Number);
  return {
    min,
    max,
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrdersPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, error } = useOwnerInboxQuery();
  const { data: restaurant } = useMyRestaurantQuery();
  const statusMutation = useOwnerOrderStatusMutation();
  const updatePreparationWindow = useUpdatePreparationWindowMutation();
  const [realtimeState, setRealtimeState] = useState("Connecting realtime...");
  const [prepWindowOverrides, setPrepWindowOverrides] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = getOwnerSocket(token);

    const handleConnect = () => {
      setRealtimeState("Realtime connected");
    };

    const handleDisconnect = () => {
      setRealtimeState("Realtime disconnected");
    };

    const handleOrderChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ["owner", "orders", "inbox"] });
      setRealtimeState("Live updates running");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("owner:orders:changed", handleOrderChanged);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("owner:orders:changed", handleOrderChanged);
      disconnectOwnerSocket();
    };
  }, [queryClient, token]);

  const grouped = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "Pending acceptance"),
      preparing: orders.filter((order) => order.status === "Preparing"),
      ready: orders.filter((order) => order.status === "Ready for pickup"),
      handoff: orders.filter((order) => order.status === "On the way"),
    }),
    [orders],
  );

  const getPrepDraft = (orderId: string, minMinutes?: number, maxMinutes?: number) =>
    prepWindowOverrides[orderId] ??
    toPrepRangeValue(
      minMinutes ?? restaurant?.defaultPrepMinMinutes ?? 15,
      maxMinutes ?? restaurant?.defaultPrepMaxMinutes ?? 20,
    );

  const handleStatusChange = async (
    orderId: string,
    status: "Preparing" | "Ready for pickup" | "Cancelled",
  ) => {
    const order = orders.find((entry) => entry.id === orderId);
    const prepDraft = getPrepDraft(
      orderId,
      order?.prepareMinMinutes,
      order?.prepareMaxMinutes,
    );
    const parsedPrepRange = parsePrepRangeValue(prepDraft);

    await statusMutation.mutateAsync({
      orderId,
      status,
      ...(status === "Preparing"
        ? {
            prepareMinMinutes: parsedPrepRange.min,
            prepareMaxMinutes: parsedPrepRange.max,
          }
        : {}),
    });
  };

  const handlePrepDraftChange = (orderId: string, value: string) => {
    setPrepWindowOverrides((current) => ({
      ...current,
      [orderId]: value,
    }));
  };

  const handleUpdatePrepWindow = async (orderId: string) => {
    const order = orders.find((entry) => entry.id === orderId);
    const prepDraft = getPrepDraft(
      orderId,
      order?.prepareMinMinutes,
      order?.prepareMaxMinutes,
    );
    const parsedPrepRange = parsePrepRangeValue(prepDraft);

    await updatePreparationWindow.mutateAsync({
      orderId,
      prepareMinMinutes: parsedPrepRange.min,
      prepareMaxMinutes: parsedPrepRange.max,
    });
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Live inbox</p>
          <h3>Keep kitchen and rider handoff clean</h3>
          <p className="muted">
            Accept new orders quickly, move them to preparation, and mark them
            ready for pickup when the kitchen finishes.
          </p>
        </div>
        <div className="hero-pill">{realtimeState}</div>
      </section>

      {error ? (
        <div className="card">
          <p className="form-error">
            {error instanceof Error ? error.message : "Unable to load orders."}
          </p>
        </div>
      ) : null}

      {statusMutation.error || updatePreparationWindow.error ? (
        <div className="card">
          <p className="form-error">
            {(statusMutation.error ?? updatePreparationWindow.error) instanceof Error
              ? (statusMutation.error ?? updatePreparationWindow.error)?.message
              : "Unable to update the kitchen timing right now."}
          </p>
        </div>
      ) : null}

      <section className="grid-two">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pending acceptance</p>
              <h3>{grouped.pending.length} orders need action</h3>
            </div>
            <div className="hero-pill">
              Default prep {restaurant?.defaultPrepMinMinutes ?? 15}-
              {restaurant?.defaultPrepMaxMinutes ?? 20} min
            </div>
          </div>

          {isLoading ? (
            <CardSkeleton lines={4} />
          ) : grouped.pending.length === 0 ? (
            <div className="empty-state">
              <strong>No fresh orders waiting</strong>
              <p className="muted">
                New customer orders will appear here first.
              </p>
            </div>
          ) : (
            <div className="order-list">
              {grouped.pending.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card-top">
                    <div>
                      <strong>{order.items.join(", ")}</strong>
                      <p className="muted-small">
                        {order.orderCode || order.id} · {formatDateTime(order.placedAt)}
                      </p>
                    </div>
                    <span className="status-chip status-chip-pending">{order.status}</span>
                  </div>
                  <div className="detail-list compact-list">
                    <div className="detail-row">
                      <span>Total</span>
                      <strong>TK {order.total}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Delivery to</span>
                      <strong>{order.deliveryAddress}</strong>
                    </div>
                  </div>
                  <div className="prep-window-card">
                    <div>
                      <strong>Estimated prepare time</strong>
                      <p className="muted-small">
                        Customer will see this range while the kitchen is preparing.
                      </p>
                    </div>
                    <div className="prep-window-grid">
                      <label className="field">
                        <span>Prep range</span>
                        <select
                          className="select-input"
                          value={getPrepDraft(order.id)}
                          onChange={(event) =>
                            handlePrepDraftChange(order.id, event.target.value)
                          }
                        >
                          {PREP_RANGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="action-cluster">
                    <button
                      className="primary-button"
                      disabled={statusMutation.isPending}
                      onClick={() => void handleStatusChange(order.id, "Preparing")}
                    >
                      Accept & start preparing
                    </button>
                    <button
                      className="danger-button"
                      disabled={statusMutation.isPending}
                      onClick={() => void handleStatusChange(order.id, "Cancelled")}
                    >
                      Cancel order
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Kitchen flow</p>
              <h3>Preparing and ready orders</h3>
            </div>
          </div>

          {isLoading ? (
            <CardSkeleton lines={5} />
          ) : (
            <div className="order-list">
              {[...grouped.preparing, ...grouped.ready, ...grouped.handoff].map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card-top">
                    <div>
                      <strong>{order.items.join(", ")}</strong>
                      <p className="muted-small">
                        {order.orderCode || order.id} · {order.restaurantName}
                      </p>
                    </div>
                    <span className="status-chip">{order.status}</span>
                  </div>
                  <div className="detail-list compact-list">
                    <div className="detail-row">
                      <span>ETA / status</span>
                      <strong>{order.eta}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Rider</span>
                      <strong>{order.riderName || "Not assigned yet"}</strong>
                    </div>
                  </div>
                  {order.status === "Preparing" ? (
                    <div className="prep-window-card">
                      <div className="prep-window-top">
                        <div>
                          <strong>Current kitchen estimate</strong>
                          <p className="muted-small">
                            {order.prepareMinMinutes ?? restaurant?.defaultPrepMinMinutes ?? 15}-
                            {order.prepareMaxMinutes ?? restaurant?.defaultPrepMaxMinutes ?? 20} min
                            {order.estimatedReadyAt
                              ? ` - Ready around ${formatDateTime(order.estimatedReadyAt)}`
                              : ""}
                          </p>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          disabled={updatePreparationWindow.isPending}
                          onClick={() => void handleUpdatePrepWindow(order.id)}
                        >
                          {updatePreparationWindow.isPending ? "Updating..." : "Update time"}
                        </button>
                      </div>
                      <div className="prep-window-grid">
                        <label className="field">
                          <span>Prep range</span>
                          <select
                            className="select-input"
                            value={getPrepDraft(
                              order.id,
                              order.prepareMinMinutes,
                              order.prepareMaxMinutes,
                            )}
                            onChange={(event) =>
                              handlePrepDraftChange(order.id, event.target.value)
                            }
                          >
                            {PREP_RANGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ) : null}
                  {order.status === "Preparing" ? (
                    <button
                      className="primary-button"
                      disabled={statusMutation.isPending}
                      onClick={() => void handleStatusChange(order.id, "Ready for pickup")}
                    >
                      Mark ready for pickup
                    </button>
                  ) : null}
                </article>
              ))}
              {grouped.preparing.length === 0 &&
              grouped.ready.length === 0 &&
              grouped.handoff.length === 0 ? (
                <div className="empty-state">
                  <strong>No kitchen work right now</strong>
                  <p className="muted">
                    Once an order moves beyond acceptance, it will stay here until rider handoff.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

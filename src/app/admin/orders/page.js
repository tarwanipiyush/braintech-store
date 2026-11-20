
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "../admin.css";

const API_URL = "/api/admin/orders";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function statusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeOrder(order) {
  const rawStatus = String(order.order_status || order.status || "pending")
    .toLowerCase();

  const statusMap = {
    placed: "Pending",
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const rawPayment = String(
    order.payment_status || order.payment || "pending"
  ).toLowerCase();

  const paymentMap = {
    paid: "Paid",
    completed: "Paid",
    success: "Paid",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Failed",
    refunded: "Refunded",
  };

  return {
    ...order,
    id: order.order_number || order.id,
    databaseId: order.id,
    customer: order.customer_name || order.customer || "Customer",
    email: order.customer_email || order.email || "",
    phone: order.customer_phone || "",
    date: order.created_at || order.date || "",
    items: Number(order.item_count ?? order.items_count ?? 0),
    total: Number(order.total ?? order.total_amount ?? 0),
    payment: paymentMap[rawPayment] || rawPayment,
    status: statusMap[rawStatus] || rawStatus,
  };
}

function getToken() {
  if (typeof window === "undefined") return "";

  return localStorage.getItem("braintech-admin-token") || "";
}

async function apiRequest(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Admin token not found. Please log in to the admin panel again."
    );
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    cache: "no-store",
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [savingStatus, setSavingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(API_URL);

      const rows = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data)
          ? data.data
          : [];

      setOrders(rows.map(normalizeOrder));
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(order.id).toLowerCase().includes(query) ||
        String(order.customer).toLowerCase().includes(query) ||
        String(order.email).toLowerCase().includes(query) ||
        String(order.phone).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All" || order.payment === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const totalOrders = Number(
    stats?.total_orders ?? orders.length
  );

  const revenue = Number(
    stats?.total_revenue ??
      orders
        .filter(
          (order) =>
            order.payment === "Paid" &&
            order.status !== "Cancelled"
        )
        .reduce((sum, order) => sum + order.total, 0)
  );

  const pendingCount = Number(
    stats?.pending_orders ??
      orders.filter(
        (order) =>
          order.status === "Pending" ||
          order.status === "Processing"
      ).length
  );

  const deliveredCount = Number(
    stats?.delivered_orders ??
      orders.filter((order) => order.status === "Delivered").length
  );

  async function openOrder(order) {
    setSelectedOrder({
      ...order,
      itemsList: [],
      payments: [],
      history: [],
    });

    setDetailLoading(true);
    setError("");

    try {
      const databaseId = order.databaseId;

      if (!databaseId) {
        throw new Error("Database order ID is missing.");
      }

      const data = await apiRequest(
        `${API_URL}?id=${encodeURIComponent(databaseId)}`
      );

      const detail = data.order || {};

      setSelectedOrder({
        ...normalizeOrder(detail),
        databaseId: detail.id || databaseId,
        itemsList: Array.isArray(data.items) ? data.items : [],
        payments: Array.isArray(data.payments) ? data.payments : [],
        history: Array.isArray(data.history) ? data.history : [],
      });
    } catch (err) {
      setNotice("");
      setError(err.message || "Could not load order details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatus(order, newStatus) {
    if (!order?.databaseId || savingStatus) return;

    const previousStatus = order.status;

    setSavingStatus(true);
    setNotice("");
    setError("");

    try {
      const statusMap = {
        Pending: "pending",
        Processing: "processing",
        Shipped: "shipped",
        Delivered: "delivered",
        Cancelled: "cancelled",
      };

      const data = await apiRequest(API_URL, {
        method: "PUT",
        body: JSON.stringify({
          id: order.databaseId,
          order_status: statusMap[newStatus] || newStatus.toLowerCase(),
          note: `Order status updated to ${newStatus} from BrainTech Admin`,
        }),
      });

      if (data.success === false) {
        throw new Error(data.message || "Status update failed.");
      }

      setOrders((current) =>
        current.map((item) =>
          item.databaseId === order.databaseId
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSelectedOrder((current) =>
        current?.databaseId === order.databaseId
          ? { ...current, status: newStatus }
          : current
      );

      setNotice(
        `Order ${order.id} updated: ${previousStatus} → ${newStatus}`
      );

      await loadOrders();
    } catch (err) {
      setError(err.message || "Could not update order status.");
    } finally {
      setSavingStatus(false);
    }
  }

  function exportOrders() {
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Phone",
      "Date",
      "Items",
      "Total INR",
      "Payment",
      "Status",
    ];

    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer,
      order.email,
      order.phone,
      order.date,
      order.items,
      order.total,
      order.payment,
      order.status,
    ]);

    const quote = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(quote).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "braintech-orders.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return (
      <main className="orders-page">
        <p>Loading orders from database...</p>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <header className="orders-header">
        <div>
          <p className="orders-eyebrow">BRAINTECH STORE / ADMIN</p>
          <h1>Orders</h1>
          <p className="orders-subtitle">
            Review orders, track payments, and update fulfilment status.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="orders-view-button"
            onClick={loadOrders}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="orders-primary-button"
            onClick={exportOrders}
          >
            Export orders
          </button>
        </div>
      </header>

      {notice && (
        <div className="orders-notice" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="orders-notice" role="alert">
          {error}
        </div>
      )}

      <section className="orders-stats">
        <article className="orders-stat-card">
          <span>Total orders</span>
          <strong>{totalOrders}</strong>
          <small>Orders from database</small>
        </article>

        <article className="orders-stat-card">
          <span>Total revenue</span>
          <strong>{formatPrice(revenue)}</strong>
          <small>Revenue reported by backend</small>
        </article>

        <article className="orders-stat-card">
          <span>Needs attention</span>
          <strong>{pendingCount}</strong>
          <small>Pending orders</small>
        </article>

        <article className="orders-stat-card">
          <span>Delivered orders</span>
          <strong>{deliveredCount}</strong>
          <small>Successfully delivered</small>
        </article>
      </section>

      <section className="orders-panel">
        <div className="orders-toolbar">
          <div>
            <h2>All orders</h2>
            <p>Search, filter, and manage order status.</p>
          </div>

          <input
            type="search"
            className="orders-search"
            placeholder="Search order or customer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="orders-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by order status"
          >
            <option value="All">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="orders-select"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            aria-label="Filter by payment status"
          >
            <option value="All">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.databaseId || order.id}>
                  <td>
                    <strong>{order.id}</strong>
                  </td>

                  <td>
                    <div className="orders-customer">
                      <strong>{order.customer}</strong>
                      <small>{order.email}</small>
                    </div>
                  </td>

                  <td>{formatDate(order.date)}</td>

                  <td>{order.items}</td>

                  <td>
                    <strong>{formatPrice(order.total)}</strong>
                  </td>

                  <td>
                    <span
                      className={`orders-badge payment-${statusClass(
                        order.payment
                      )}`}
                    >
                      {order.payment}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`orders-badge order-${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="orders-view-button"
                      onClick={() => openOrder(order)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="orders-empty">
                    {loading
                      ? "Loading orders..."
                      : "No orders match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="orders-footer">
          Showing {filteredOrders.length} of {orders.length} orders
        </footer>
      </section>

      {selectedOrder && (
        <div
          className="orders-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            className="orders-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orders-modal-title"
          >
            <header className="orders-modal-header">
              <div>
                <p className="orders-eyebrow">ORDER DETAILS</p>
                <h2 id="orders-modal-title">{selectedOrder.id}</h2>
              </div>

              <button
                type="button"
                className="orders-close-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ×
              </button>
            </header>

            {detailLoading ? (
              <p>Loading order details...</p>
            ) : (
              <>
                <div className="orders-detail-grid">
                  <div>
                    <span>Customer</span>
                    <strong>{selectedOrder.customer}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedOrder.email || "—"}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{selectedOrder.phone || "—"}</strong>
                  </div>

                  <div>
                    <span>Order date</span>
                    <strong>{formatDate(selectedOrder.date)}</strong>
                  </div>

                  <div>
                    <span>Items</span>
                    <strong>{selectedOrder.items}</strong>
                  </div>

                  <div>
                    <span>Order total</span>
                    <strong>{formatPrice(selectedOrder.total)}</strong>
                  </div>

                  <div>
                    <span>Payment status</span>
                    <strong>{selectedOrder.payment}</strong>
                  </div>
                </div>

                <label className="orders-field-label">
                  Order status
                  <select
                    className="orders-select orders-modal-select"
                    value={selectedOrder.status}
                    disabled={savingStatus}
                    onChange={(event) =>
                      updateStatus(selectedOrder, event.target.value)
                    }
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedOrder.shipping_address && (
                  <div style={{ marginTop: 16 }}>
                    <strong>Shipping address</strong>
                    <p>{selectedOrder.shipping_address}</p>
                  </div>
                )}

                {selectedOrder.itemsList?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h3>Order items</h3>

                    <div className="orders-table-wrap">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedOrder.itemsList.map((item, index) => (
                            <tr key={item.id || index}>
                              <td>
                                <strong>
                                  {item.product_name || "Product"}
                                </strong>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatPrice(item.unit_price)}</td>
                              <td>{formatPrice(item.line_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedOrder.payments?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h3>Payment records</h3>

                    {selectedOrder.payments.map((payment) => (
                      <div
                        key={payment.id}
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid #333",
                        }}
                      >
                        <strong>
                          {formatPrice(payment.amount)}
                        </strong>
                        {" — "}
                        {payment.payment_method || payment.payment_provider}
                        {" — "}
                        {payment.status}
                      </div>
                    ))}
                  </div>
                )}

                {selectedOrder.history?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h3>Order history</h3>

                    {selectedOrder.history.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid #333",
                        }}
                      >
                        <strong>
                          {entry.previous_status || "Created"}
                          {" → "}
                          {entry.new_status}
                        </strong>
                        <small style={{ display: "block" }}>
                          {formatDate(entry.created_at)}
                        </small>
                        {entry.note && <p>{entry.note}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="orders-primary-button orders-done-button"
                  onClick={() => setSelectedOrder(null)}
                >
                  Done
                </button>
              </>
            )}
          </section>
        </div>
      )}

      <p className="orders-storage-note">
        Orders are loaded from your Hostinger database. Order status
        changes are saved through the backend.
      </p>
    </main>
  );
}

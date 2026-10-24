
"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const STORAGE_KEY = "braintech-admin-orders-v1";

const INITIAL_ORDERS = [
  {
    id: "BT-1001",
    customer: "Aarav Sharma",
    email: "aarav@example.com",
    date: "2026-10-20",
    items: 2,
    total: 58498,
    payment: "Paid",
    status: "Processing",
  },
  {
    id: "BT-1002",
    customer: "Priya Patel",
    email: "priya@example.com",
    date: "2026-10-20",
    items: 1,
    total: 72999,
    payment: "Paid",
    status: "Shipped",
  },
  {
    id: "BT-1003",
    customer: "Rahul Verma",
    email: "rahul@example.com",
    date: "2026-10-19",
    items: 3,
    total: 124997,
    payment: "Pending",
    status: "Pending",
  },
  {
    id: "BT-1004",
    customer: "Sneha Desai",
    email: "sneha@example.com",
    date: "2026-10-18",
    items: 1,
    total: 24999,
    payment: "Paid",
    status: "Delivered",
  },
  {
    id: "BT-1005",
    customer: "Ishaan Mehta",
    email: "ishaan@example.com",
    date: "2026-10-17",
    items: 2,
    total: 41998,
    payment: "Failed",
    status: "Cancelled",
  },
];

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function statusClass(status) {
  return String(status).toLowerCase().replace(/\s+/g, "-");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setOrders(saved ? JSON.parse(saved) : INITIAL_ORDERS);
    } catch (error) {
      console.error("Could not load orders:", error);
      setOrders(INITIAL_ORDERS);
    }
    setLoaded(true);
  }, []);

  function persistOrders(nextOrders, message) {
    setOrders(nextOrders);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders));
      setNotice(message);
    } catch (error) {
      console.error("Could not save orders:", error);
      setNotice("Could not save changes. Browser storage may be full.");
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(order.id).toLowerCase().includes(query) ||
        String(order.customer).toLowerCase().includes(query) ||
        String(order.email).toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All" || order.status === statusFilter) &&
        (paymentFilter === "All" || order.payment === paymentFilter)
      );
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const revenue = orders
    .filter((order) => order.payment === "Paid" && order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const pendingCount = orders.filter(
    (order) => order.status === "Pending" || order.status === "Processing"
  ).length;

  const paidCount = orders.filter((order) => order.payment === "Paid").length;

  function updateStatus(orderId, status) {
    const next = orders.map((order) =>
      order.id === orderId ? { ...order, status } : order
    );
    persistOrders(next, `Order ${orderId} status updated to ${status}.`);

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  }

  function updatePayment(orderId, payment) {
    const next = orders.map((order) =>
      order.id === orderId ? { ...order, payment } : order
    );
    persistOrders(next, `Order ${orderId} payment updated.`);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, payment });
    }
  }

  function exportOrders() {
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Date",
      "Items",
      "Total INR",
      "Payment",
      "Status",
    ];

    const rows = orders.map((order) => [
      order.id,
      order.customer,
      order.email,
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
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return <main className="orders-page">Loading orders...</main>;
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

        <button
          type="button"
          className="orders-primary-button"
          onClick={exportOrders}
        >
          Export orders
        </button>
      </header>

      {notice && (
        <div className="orders-notice" role="status">
          {notice}
        </div>
      )}

      <section className="orders-stats">
        <article className="orders-stat-card">
          <span>Total orders</span>
          <strong>{orders.length}</strong>
          <small>Orders in this preview</small>
        </article>
        <article className="orders-stat-card">
          <span>Paid order value</span>
          <strong>{formatPrice(revenue)}</strong>
          <small>Paid, non-cancelled orders</small>
        </article>
        <article className="orders-stat-card">
          <span>Needs attention</span>
          <strong>{pendingCount}</strong>
          <small>Pending or processing</small>
        </article>
        <article className="orders-stat-card">
          <span>Paid orders</span>
          <strong>{paidCount}</strong>
          <small>Payment marked as paid</small>
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
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
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
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                  </td>
                  <td>
                    <div className="orders-customer">
                      <strong>{order.customer}</strong>
                      <small>{order.email}</small>
                    </div>
                  </td>
                  <td>{order.date}</td>
                  <td>{order.items}</td>
                  <td>
                    <strong>{formatPrice(order.total)}</strong>
                  </td>
                  <td>
                    <span
                      className={`orders-badge payment-${statusClass(order.payment)}`}
                    >
                      {order.payment}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`orders-badge order-${statusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="orders-view-button"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="orders-empty">
                    No orders match your filters.
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

            <div className="orders-detail-grid">
              <div>
                <span>Customer</span>
                <strong>{selectedOrder.customer}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedOrder.email}</strong>
              </div>
              <div>
                <span>Order date</span>
                <strong>{selectedOrder.date}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{selectedOrder.items}</strong>
              </div>
              <div>
                <span>Order total</span>
                <strong>{formatPrice(selectedOrder.total)}</strong>
              </div>
            </div>

            <label className="orders-field-label">
              Order status
              <select
                className="orders-select orders-modal-select"
                value={selectedOrder.status}
                onChange={(event) =>
                  updateStatus(selectedOrder.id, event.target.value)
                }
              >
                <option>Pending</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </label>

            <label className="orders-field-label">
              Payment status
              <select
                className="orders-select orders-modal-select"
                value={selectedOrder.payment}
                onChange={(event) =>
                  updatePayment(selectedOrder.id, event.target.value)
                }
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Failed</option>
              </select>
            </label>

            <button
              type="button"
              className="orders-primary-button orders-done-button"
              onClick={() => setSelectedOrder(null)}
            >
              Done
            </button>
          </section>
        </div>
      )}

      <p className="orders-storage-note">
        Frontend preview with sample orders. Changes are saved in this
        browser only; real customer orders and payment verification will
        be connected to the backend later.
      </p>
    </main>
  );
}

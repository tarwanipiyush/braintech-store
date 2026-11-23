
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const canCancelOrder = (order) => {
  const status = String(order.orderStatus || "").trim().toLowerCase();

  return (
    ["placed", "pending", "processing", "order placed"].includes(status) &&
    Boolean(order.orderId)
  );
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelErrors, setCancelErrors] = useState({});

  const loadOrders = useCallback(async () => {
    setLoadingError("");

    try {
      const supabase = createClient();

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session?.access_token) {
        throw new Error("Please sign in to view your orders.");
      }

      const response = await fetch("/api/store/orders/list", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load your orders.");
      }

      const databaseOrders = Array.isArray(result.orders)
        ? result.orders
        : [];

      setOrders(databaseOrders);

      // Keep local order history synchronized with the database.
      localStorage.setItem(
        "braintech-orders",
        JSON.stringify(databaseOrders)
      );

      if (databaseOrders.length > 0) {
        localStorage.setItem(
          "braintech-latest-order",
          JSON.stringify(databaseOrders[0])
        );
      } else {
        localStorage.removeItem("braintech-latest-order");
      }
    } catch (error) {
      setLoadingError(
        error.message || "Unable to load your orders. Please try again."
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleCancelOrder(order) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${order.orderId}?`
    );

    if (!confirmed) return;

    setCancellingOrder(order.orderId);
    setCancelErrors((previous) => ({
      ...previous,
      [order.orderId]: "",
    }));

    try {
      const supabase = createClient();

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session?.access_token) {
        throw new Error(
          "Please sign in again before cancelling your order."
        );
      }

      const response = await fetch("/api/store/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderNumber: order.orderId,
        }),
        cache: "no-store",
      });

      const result = await response.json();

      const alreadyCancelled =
        String(result.message || "")
          .toLowerCase()
          .includes("already been cancelled") ||
        String(result.orderStatus || "").toLowerCase() === "cancelled";

      if ((!response.ok || !result.success) && !alreadyCancelled) {
        throw new Error(result.message || "Unable to cancel this order.");
      }

      await loadOrders();
    } catch (error) {
      setCancelErrors((previous) => ({
        ...previous,
        [order.orderId]:
          error.message || "Something went wrong. Please try again.",
      }));
    } finally {
      setCancellingOrder(null);
    }
  }

  if (!loaded) {
    return (
      <main className="my-orders-page">
        <p>Loading your orders...</p>
        <OrdersStyles />
      </main>
    );
  }

  return (
    <main className="my-orders-page">
      <header className="my-orders-header">
        <Link href="/" className="my-orders-logo">
          BRAIN<span>TECH</span>
        </Link>

        <Link href="/cart" className="my-orders-cart-link">
          View cart
        </Link>
      </header>

      <section className="my-orders-content">
        <div className="my-orders-title-row">
          <div>
            <p className="my-orders-eyebrow">YOUR ACCOUNT</p>
            <h1>My Orders</h1>
            <p className="my-orders-subtitle">
              Track your purchases and review your order details.
            </p>
          </div>

          <span className="my-orders-count">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {loadingError && (
          <div className="my-orders-empty">
            <h2>Unable to load orders</h2>
            <p>{loadingError}</p>
            <button
              type="button"
              className="my-orders-primary"
              onClick={() => {
                setLoaded(false);
                loadOrders();
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!loadingError && orders.length === 0 && (
          <div className="my-orders-empty">
            <div className="my-orders-empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>
              When you place an order, its details will appear here.
            </p>
            <Link href="/shop" className="my-orders-primary">
              Start shopping
            </Link>
          </div>
        )}

        {!loadingError && orders.length > 0 && (
          <div className="my-orders-list">
            {orders.map((order) => (
              <article className="my-order-card" key={order.orderId}>
                <div className="my-order-top">
                  <div>
                    <span className="my-order-label">ORDER NUMBER</span>
                    <h2>{order.orderId}</h2>
                    <p className="my-order-date">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`my-order-status ${
                      String(order.orderStatus || "")
                        .toLowerCase()
                        .includes("cancel")
                        ? "cancelled"
                        : ""
                    }`}
                  >
                    {order.orderStatus || "Order placed"}
                  </span>
                </div>

                <div className="my-order-items">
                  {(Array.isArray(order.items) ? order.items : []).map(
                    (item, index) => (
                      <div
                        className="my-order-item"
                        key={item.id ?? `${item.name || item.title}-${index}`}
                      >
                        <div className="my-order-item-info">
                          <strong>
                            {item.name || item.title || "Product"}
                          </strong>
                          <span>
                            Quantity: {Number(item.quantity) || 1}
                          </span>
                        </div>

                        <strong>
                          {formatPrice(
                            (Number(item.price) || 0) *
                              (Number(item.quantity) || 1)
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                <div className="my-order-bottom">
                  <div>
                    <span className="my-order-label">PAYMENT</span>
                    <p>
                      {order.paymentMethod === "cod"
                        ? "Cash on delivery"
                        : order.paymentMethod === "upi"
                        ? "UPI — payment pending"
                        : "Card — payment pending"}
                    </p>
                  </div>

                  <div className="my-order-total">
                    <span className="my-order-label">ORDER TOTAL</span>
                    <strong>
                      {formatPrice(order.total ?? order.subtotal)}
                    </strong>
                  </div>
                </div>

                <details className="my-order-address">
                  <summary>View delivery address</summary>
                  <p>
                    <strong>{order.address?.fullName || "Customer"}</strong>
                    <br />
                    {order.address?.address || ""}
                    <br />
                    {order.address?.landmark
                      ? `${order.address.landmark}, `
                      : ""}
                    {order.address?.city || ""},{" "}
                    {order.address?.state || ""} -{" "}
                    {order.address?.pincode || ""}
                    <br />
                    Phone: {order.address?.phone || "Not provided"}
                  </p>
                </details>

                {canCancelOrder(order) && (
                  <div className="my-order-cancel-section">
                    <button
                      type="button"
                      className="my-order-cancel-button"
                      onClick={() => handleCancelOrder(order)}
                      disabled={cancellingOrder === order.orderId}
                    >
                      {cancellingOrder === order.orderId
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </button>

                    {cancelErrors[order.orderId] && (
                      <p className="my-order-cancel-error">
                        {cancelErrors[order.orderId]}
                      </p>
                    )}

                    <p className="my-order-cancel-note">
                      Orders can only be cancelled before shipping.
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <Link href="/shop" className="my-orders-back">
          ← Continue shopping
        </Link>
      </section>

      <footer className="my-orders-footer">
        © {new Date().getFullYear()} BrainTech Store. All rights reserved.
      </footer>

      <OrdersStyles />
    </main>
  );
}

function OrdersStyles() {
  return (
    <style>{`
      .my-orders-page {
        min-height: 100vh;
        background: #f5f7fb;
        color: #172033;
        font-family: Arial, Helvetica, sans-serif;
      }

      .my-orders-page * { box-sizing: border-box; }
      .my-orders-page a { text-decoration: none; }

      .my-orders-header {
        min-height: 76px;
        padding: 16px 6%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #fff;
        border-bottom: 1px solid #e5eaf2;
      }

      .my-orders-logo {
        color: #111827;
        font-size: 25px;
        font-weight: 900;
        letter-spacing: -1px;
      }

      .my-orders-logo span { color: #2563eb; }

      .my-orders-cart-link {
        color: #2563eb;
        font-size: 13px;
        font-weight: 700;
      }

      .my-orders-content {
        width: min(900px, 92%);
        margin: 38px auto;
      }

      .my-orders-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 26px;
      }

      .my-orders-eyebrow {
        margin: 0 0 8px;
        color: #2563eb;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.5px;
      }

      .my-orders-title-row h1 {
        margin: 0;
        font-size: clamp(27px, 4vw, 34px);
      }

      .my-orders-subtitle {
        margin: 10px 0 0;
        color: #657087;
        font-size: 14px;
        line-height: 1.6;
      }

      .my-orders-count {
        padding: 9px 12px;
        border-radius: 20px;
        background: #eaf1ff;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .my-orders-empty {
        padding: 48px 22px;
        border: 1px solid #e3e8f0;
        border-radius: 14px;
        background: #fff;
        text-align: center;
      }

      .my-orders-empty-icon { font-size: 42px; }

      .my-orders-empty h2 {
        margin: 16px 0 8px;
        font-size: 21px;
      }

      .my-orders-empty p {
        margin: 0 0 22px;
        color: #657087;
        font-size: 14px;
        line-height: 1.6;
      }

      .my-orders-primary {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        border: 0;
        border-radius: 9px;
        background: #2563eb;
        color: white;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .my-orders-list {
        display: grid;
        gap: 18px;
      }

      .my-order-card {
        overflow: hidden;
        border: 1px solid #e3e8f0;
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 5px 22px rgba(15, 23, 42, .035);
      }

      .my-order-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 22px;
        border-bottom: 1px solid #edf0f5;
      }

      .my-order-label {
        display: block;
        color: #8791a3;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
      }

      .my-order-top h2 {
        margin: 7px 0;
        font-size: 17px;
      }

      .my-order-date {
        margin: 0;
        color: #657087;
        font-size: 12px;
      }

      .my-order-status {
        padding: 8px 10px;
        border-radius: 20px;
        background: #dcfce7;
        color: #166534;
        font-size: 11px;
        font-weight: 700;
        text-transform: capitalize;
      }

      .my-order-status.cancelled {
        background: #fee2e2;
        color: #991b1b;
      }

      .my-order-items { padding: 0 22px; }

      .my-order-item {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #edf0f5;
      }

      .my-order-item-info {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      .my-order-item-info strong {
        font-size: 13px;
        overflow-wrap: anywhere;
      }

      .my-order-item-info span {
        color: #778196;
        font-size: 12px;
      }

      .my-order-item > strong {
        font-size: 13px;
        white-space: nowrap;
      }

      .my-order-bottom {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        padding: 18px 22px;
        background: #fafbfe;
      }

      .my-order-bottom p {
        margin: 7px 0 0;
        color: #526078;
        font-size: 12px;
      }

      .my-order-total { text-align: right; }

      .my-order-total strong {
        display: block;
        margin-top: 6px;
        font-size: 20px;
      }

      .my-order-address {
        padding: 15px 22px;
        border-top: 1px solid #edf0f5;
      }

      .my-order-address summary {
        color: #2563eb;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .my-order-address p {
        margin: 12px 0 0;
        color: #596579;
        font-size: 12px;
        line-height: 1.8;
        overflow-wrap: anywhere;
      }

      .my-order-address p strong { color: #172033; }

      .my-order-cancel-section {
        padding: 16px 22px 20px;
        border-top: 1px solid #edf0f5;
      }

      .my-order-cancel-button {
        min-height: 39px;
        padding: 0 16px;
        border: 1px solid #dc2626;
        border-radius: 8px;
        background: #fff;
        color: #dc2626;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .my-order-cancel-button:hover:not(:disabled) {
        background: #fef2f2;
      }

      .my-order-cancel-button:disabled {
        opacity: .6;
        cursor: not-allowed;
      }

      .my-order-cancel-note {
        margin: 9px 0 0;
        color: #8791a3;
        font-size: 11px;
      }

      .my-order-cancel-error {
        margin: 10px 0 0;
        color: #dc2626;
        font-size: 12px;
        line-height: 1.5;
      }

      .my-orders-back {
        display: block;
        margin-top: 24px;
        color: #2563eb;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
      }

      .my-orders-footer {
        padding: 20px;
        border-top: 1px solid #e4e9f1;
        color: #8791a3;
        text-align: center;
        font-size: 12px;
      }

      @media (max-width: 560px) {
        .my-orders-header { padding: 15px 5%; }
        .my-orders-logo { font-size: 21px; }
        .my-orders-content { margin: 25px auto; }
        .my-orders-title-row { align-items: flex-start; }
        .my-orders-subtitle { font-size: 12px; }
        .my-order-top { padding: 17px; }
        .my-order-items { padding: 0 17px; }
        .my-order-bottom { padding: 16px 17px; }
        .my-order-address { padding: 14px 17px; }
        .my-order-status { font-size: 10px; }
        .my-order-cancel-section { padding: 14px 17px 17px; }
      }
    `}</style>
  );
}

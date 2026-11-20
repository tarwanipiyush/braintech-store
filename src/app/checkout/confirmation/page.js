"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export default function CheckoutConfirmationPage() {
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("braintech-latest-order");

      if (savedOrder) {
        setOrder(JSON.parse(savedOrder));
      }
    } catch {
      setOrder(null);
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <main className="confirmation-page">
        <p>Loading your order confirmation...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card">
          <div className="confirmation-icon">!</div>
          <h1>No order found</h1>
          <p>
            We couldn't find an order on this device. Please review your cart
            and try again.
          </p>
          <Link href="/cart" className="confirmation-button">
            Return to cart
          </Link>
        </div>
        <ConfirmationStyles />
      </main>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.address || {};

  return (
    <main className="confirmation-page">
      <header className="confirmation-header">
        <Link href="/" className="confirmation-logo">
          BRAIN<span>TECH</span>
        </Link>
        <span className="confirmation-secure">🔒 Secure checkout</span>
      </header>

      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>

        <p className="confirmation-eyebrow">THANK YOU FOR YOUR ORDER</p>
        <h1>Your order has been placed!</h1>
        <p className="confirmation-description">
          Thank you for shopping with BrainTech Store. Keep your order number
          for future reference.
        </p>

        <div className="confirmation-order-number">
          <span>Order number</span>
          <strong>{order.orderId || "Pending"}</strong>
        </div>

        <div className="confirmation-status">
          <span>Order status</span>
          <strong>{order.orderStatus || "Order placed"}</strong>
        </div>

        <div className="confirmation-status">
          <span>Payment method</span>
          <strong>
            {order.paymentMethod === "cod"
              ? "Cash on delivery"
              : order.paymentMethod === "upi"
              ? "UPI — payment pending"
              : "Card — payment pending"}
          </strong>
        </div>

        <div className="confirmation-section">
          <h2>Order items</h2>

          {items.map((item, index) => (
            <div
              className="confirmation-item"
              key={item.id ?? `${item.name ?? item.title ?? "item"}-${index}`}
            >
              <div className="confirmation-item-info">
                <strong>{item.name || item.title || "Product"}</strong>
                <span>Quantity: {Number(item.quantity) || 1}</span>
              </div>
              <strong>
                {formatPrice(
                  (Number(item.price) || 0) * (Number(item.quantity) || 1)
                )}
              </strong>
            </div>
          ))}
        </div>

        <div className="confirmation-section">
          <h2>Delivery address</h2>
          <p className="confirmation-address">
            <strong>{address.fullName || "Customer"}</strong>
            <br />
            {address.address || ""}
            <br />
            {address.landmark ? `${address.landmark}, ` : ""}
            {address.city || ""}, {address.state || ""} -{" "}
            {address.pincode || ""}
            <br />
            Phone: {address.phone || "Not provided"}
          </p>
        </div>

        <div className="confirmation-total">
          <span>Order total</span>
          <strong>{formatPrice(order.total ?? order.subtotal)}</strong>
        </div>

        {order.paymentMethod !== "cod" && (
          <p className="confirmation-payment-note">
            Online payment has not been processed. Your order record is saved
            locally on this device; connect a payment gateway and backend
            before accepting real customer orders.
          </p>
        )}
<Link href="/my-orders" className="confirmation-button">
  View my orders →
</Link>

<Link href="/shop" className="confirmation-home">
  Continue shopping
</Link>

<Link href="/" className="confirmation-home">
  Back to homepage
</Link>

      </div>

      <footer className="confirmation-footer">
        © {new Date().getFullYear()} BrainTech Store. All rights reserved.
      </footer>

      <ConfirmationStyles />
    </main>
  );
}

function ConfirmationStyles() {
  return (
    <style>{`
      .confirmation-page {
        min-height: 100vh;
        padding-bottom: 28px;
        background: #f5f7fb;
        color: #172033;
        font-family: Arial, Helvetica, sans-serif;
      }
      .confirmation-page * { box-sizing: border-box; }
      .confirmation-page a { text-decoration: none; }
      .confirmation-header {
        min-height: 76px;
        padding: 16px 6%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        background: #fff;
        border-bottom: 1px solid #e5eaf2;
      }
      .confirmation-logo {
        color: #111827;
        font-size: 25px;
        font-weight: 900;
        letter-spacing: -1px;
      }
      .confirmation-logo span { color: #2563eb; }
      .confirmation-secure { color: #526078; font-size: 13px; }
      .confirmation-card {
        width: min(680px, 92%);
        margin: 42px auto;
        padding: 32px;
        background: #fff;
        border: 1px solid #e3e8f0;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(15, 23, 42, .05);
      }
      .confirmation-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 18px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #dcfce7;
        color: #15803d;
        font-size: 34px;
        font-weight: 800;
      }
      .confirmation-card > .confirmation-icon,
      .confirmation-eyebrow,
      .confirmation-card > h1,
      .confirmation-description { text-align: center; }
      .confirmation-eyebrow {
        margin: 0 0 10px;
        color: #15803d;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.5px;
      }
      .confirmation-card h1 {
        margin: 0 0 12px;
        color: #172033;
        font-size: clamp(24px, 4vw, 32px);
        line-height: 1.25;
      }
      .confirmation-description {
        max-width: 470px;
        margin: 0 auto 26px;
        color: #657087;
        font-size: 14px;
        line-height: 1.7;
      }
      .confirmation-order-number {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px;
        border: 1px dashed #93b4ff;
        border-radius: 10px;
        background: #f5f8ff;
      }
      .confirmation-order-number span,
      .confirmation-status span { color: #657087; font-size: 13px; }
      .confirmation-order-number strong { color: #1d4ed8; overflow-wrap: anywhere; }
      .confirmation-status {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 15px 0;
        border-bottom: 1px solid #edf0f5;
      }
      .confirmation-status strong {
        font-size: 13px;
        text-align: right;
      }
      .confirmation-section { margin-top: 26px; }
      .confirmation-section h2 {
        margin: 0 0 14px;
        font-size: 16px;
      }
      .confirmation-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 0;
        border-top: 1px solid #edf0f5;
      }
      .confirmation-item-info {
        display: grid;
        gap: 7px;
        min-width: 0;
      }
      .confirmation-item-info strong { font-size: 13px; overflow-wrap: anywhere; }
      .confirmation-item-info span { color: #778196; font-size: 12px; }
      .confirmation-item > strong { font-size: 13px; white-space: nowrap; }
      .confirmation-address {
        margin: 0;
        padding: 16px;
        border-radius: 10px;
        background: #f8fafc;
        color: #596579;
        font-size: 13px;
        line-height: 1.9;
        overflow-wrap: anywhere;
      }
      .confirmation-address strong { color: #172033; }
      .confirmation-total {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 24px;
        padding: 20px 0;
        border-top: 1px solid #e3e8f0;
        color: #172033;
        font-size: 16px;
      }
      .confirmation-total strong { font-size: 21px; }
      .confirmation-payment-note {
        padding: 13px;
        border: 1px solid #f8e2a8;
        border-radius: 9px;
        background: #fff8e8;
        color: #8a5b08;
        font-size: 12px;
        line-height: 1.7;
      }
      .confirmation-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 50px;
        margin-top: 20px;
        padding: 14px;
        border-radius: 10px;
        background: #2563eb;
        color: #fff !important;
        font-size: 14px;
        font-weight: 700;
      }
      .confirmation-button:hover { background: #1d4ed8; }
      .confirmation-home {
        display: block;
        margin-top: 18px;
        color: #2563eb;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
      }
      .confirmation-footer {
        padding: 18px;
        color: #8791a3;
        text-align: center;
        font-size: 12px;
      }
      @media (max-width: 560px) {
        .confirmation-header { padding: 15px 5%; }
        .confirmation-logo { font-size: 21px; }
        .confirmation-card { margin: 24px auto; padding: 20px; }
        .confirmation-order-number,
        .confirmation-status { align-items: flex-start; }
      }
    `}</style>
  );
}

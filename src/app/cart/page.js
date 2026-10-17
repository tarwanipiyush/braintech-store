"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
const {
cart,
cartCount,
cartTotal,
updateQuantity,
removeFromCart,
loaded,
} = useCart();

const [showLoginPopup, setShowLoginPopup] = useState(false);

const money = (amount) => "₹" + amount.toLocaleString("en-IN");

if (!loaded) {
return ( <main className="cart-page"> <p className="cart-loading">Loading your cart...</p> </main>
);
}

return ( <main className="cart-page"> <header className="cart-page-header"> <Link href="/" className="cart-brand"> <span className="cart-brand-mark">B</span> <span> <b>BRAINTECH</b> <small>PC COMPONENTS & BUILDS</small> </span> </Link>

```
    <Link href="/" className="cart-continue-top">
      ← Continue shopping
    </Link>
  </header>

  <div className="cart-container">
    <div className="cart-title-row">
      <div>
        <span className="section-kicker">YOUR SELECTION</span>
        <h1>Your shopping cart</h1>
        <p>
          {cartCount} item{cartCount === 1 ? "" : "s"} in your cart
        </p>
      </div>
    </div>

    {cart.length === 0 ? (
      <div className="cart-empty">
        <div className="cart-empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven’t added any hardware yet.</p>
        <Link href="/" className="cart-primary-button">
          Explore products ↗
        </Link>
      </div>
    ) : (
      <div className="cart-layout">
        <section className="cart-items-list" aria-label="Cart items">
          {cart.map((item) => (
            <article className="cart-item-card" key={item.id}>
              <div className="cart-item-image-wrap">
                {item.image ? (
                  <img
                    className="cart-item-image"
                    src={item.image}
                    alt={item.name}
                  />
                ) : (
                  <div className="cart-image-fallback">B</div>
                )}
              </div>

              <div className="cart-item-info">
                <span className="cart-item-category">
                  {item.category || "PC COMPONENTS"}
                </span>
                <h2>{item.name}</h2>
                <p className="cart-unit-price">
                  {money(item.price)} <span>each</span>
                </p>

                <div className="cart-item-controls">
                  <div className="cart-quantity-control">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="cart-remove-button"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove item
                  </button>
                </div>
              </div>

              <div className="cart-item-total">
                {money(item.price * item.quantity)}
                <small>Item subtotal</small>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <span className="section-kicker">ORDER DETAILS</span>
          <h2>Order summary</h2>

          <div className="cart-summary-line">
            <span>Items ({cartCount})</span>
            <b>{money(cartTotal)}</b>
          </div>

          <div className="cart-summary-line">
            <span>Shipping</span>
            <span className="cart-muted">Calculated at checkout</span>
          </div>

          <div className="cart-summary-total">
            <span>Estimated total</span>
            <strong>{money(cartTotal)}</strong>
          </div>

          <p className="cart-summary-note">
            Shipping and any applicable taxes will be calculated at checkout.
          </p>

          <button
            type="button"
            className="cart-primary-button cart-checkout-button"
            onClick={() => setShowLoginPopup(true)}
            style={{
              width: "100%",
              border: "none",
              cursor: "pointer",
              font: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Proceed to checkout <span>→</span>
          </button>

          <Link href="/" className="cart-continue-link">
            Continue shopping
          </Link>
        </aside>
      </div>
    )}
  </div>

  {showLoginPopup && (
    <div
      onClick={() => setShowLoginPopup(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-popup-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          padding: "36px 28px",
          textAlign: "center",
          background: "#171720",
          color: "#f4f5fb",
          border: "1px solid rgba(255, 70, 84, 0.45)",
          borderRadius: "18px",
          boxShadow: "0 20px 70px rgba(0, 0, 0, 0.5)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowLoginPopup(false)}
          aria-label="Close popup"
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            border: "none",
            background: "transparent",
            color: "#aaa",
            fontSize: "26px",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div style={{ fontSize: "42px", marginBottom: "12px" }}>🔐</div>

        <h2
          id="login-popup-title"
          style={{ fontSize: "24px", margin: "0 0 12px" }}
        >
          Please log in first
        </h2>

        <p
          style={{
            color: "#b5b5c5",
            fontSize: "14px",
            lineHeight: 1.7,
            marginBottom: "24px",
          }}
        >
          Please sign in to your BrainTech account before proceeding to
          checkout.
        </p>

        <Link
          href="/login"
          className="cart-primary-button"
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            boxSizing: "border-box",
            textDecoration: "none",
            marginBottom: "12px",
          }}
        >
          Sign In →
        </Link>

        <Link
          href="/register"
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 16px",
            border: "1px solid #41414f",
            borderRadius: "9px",
            color: "#f4f5fb",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Create Account
        </Link>

        <button
          type="button"
          onClick={() => setShowLoginPopup(false)}
          style={{
            marginTop: "18px",
            border: "none",
            background: "transparent",
            color: "#a5a5b5",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Continue shopping
        </button>
      </div>
    </div>
  )}
</main>


);
}

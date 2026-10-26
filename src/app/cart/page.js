
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

  const money = (amount) =>
    "₹" + Number(amount || 0).toLocaleString("en-IN");

  const lightPageStyle = {
    backgroundColor: "#f5f7fb",
    color: "#172033",
    minHeight: "100vh",
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  if (!loaded) {
    return (
      <main className="cart-page cart-light-page" style={lightPageStyle}>
        <div className="cart-loading">Loading your cart...</div>

        <style jsx>{`
          .cart-light-page {
            width: 100%;
            box-sizing: border-box;
            padding: 40px 20px;
          }

          .cart-loading {
            width: min(1100px, 100%);
            margin: 40px auto;
            color: #566174;
            text-align: center;
            font-size: 15px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="cart-page cart-light-page" style={lightPageStyle}>
      <header className="cart-page-header">
        <Link href="/" className="cart-brand">
          <span className="cart-brand-mark">B</span>
          <span className="cart-brand-text">
            <b>BRAINTECH</b>
            <small>PC COMPONENTS &amp; BUILDS</small>
          </span>
        </Link>

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
            <div className="cart-empty-icon" aria-hidden="true">
              🛒
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven’t added any hardware yet.</p>

            <Link href="/" className="cart-primary-button">
              Explore products ↗
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section
              className="cart-items-list"
              aria-label="Cart items"
            >
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
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
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
                <span className="cart-muted">
                  Calculated at checkout
                </span>
              </div>

              <div className="cart-summary-total">
                <span>Estimated total</span>
                <strong>{money(cartTotal)}</strong>
              </div>

              <p className="cart-summary-note">
                Shipping and any applicable taxes will be calculated
                at checkout.
              </p>

              <button
                type="button"
                className="cart-primary-button cart-checkout-button"
                onClick={() => setShowLoginPopup(true)}
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
          className="login-popup-backdrop"
          onClick={() => setShowLoginPopup(false)}
        >
          <div
            className="login-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="login-popup-close"
              onClick={() => setShowLoginPopup(false)}
              aria-label="Close popup"
            >
              ×
            </button>

            <div className="login-popup-icon" aria-hidden="true">
              🔐
            </div>

            <h2 id="login-popup-title">Please log in first</h2>

            <p>
              Please sign in to your BrainTech account before
              proceeding to checkout.
            </p>

            <Link href="/login" className="cart-primary-button popup-link">
              Sign In →
            </Link>

            <Link href="/register" className="popup-register-link">
              Create Account
            </Link>

            <button
              type="button"
              className="popup-cancel"
              onClick={() => setShowLoginPopup(false)}
            >
              Continue shopping
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .cart-light-page {
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
          background: #f5f7fb;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
        }

        .cart-page-header {
          min-height: 76px;
          box-sizing: border-box;
          padding: 14px clamp(18px, 5vw, 76px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .cart-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #172033;
          text-decoration: none;
        }

        .cart-brand-mark {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: linear-gradient(135deg, #ef233c, #c8102e);
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
        }

        .cart-brand-text b,
        .cart-brand-text small {
          display: block;
        }

        .cart-brand-text b {
          font-size: 18px;
          letter-spacing: 0.3px;
        }

        .cart-brand-text small {
          margin-top: 4px;
          color: #687386;
          font-size: 9px;
          letter-spacing: 1.8px;
        }

        .cart-continue-top {
          color: #d7193f;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .cart-continue-top:hover,
        .cart-continue-link:hover {
          color: #a70f2d;
        }

        .cart-container {
          width: min(1100px, calc(100% - 36px));
          box-sizing: border-box;
          margin: 0 auto;
          padding: 36px 0 65px;
        }

        .cart-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 26px;
        }

        .section-kicker {
          display: block;
          margin-bottom: 12px;
          color: #d7193f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .cart-title-row h1 {
          margin: 0;
          color: #172033;
          font-size: clamp(29px, 4vw, 38px);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .cart-title-row p {
          margin: 12px 0 0;
          color: #647084;
          font-size: 13px;
        }

        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          min-height: 300px;
          padding: 36px 20px;
          border: 1px solid #e1e6ef;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 5px 24px rgba(25, 35, 55, 0.04);
          text-align: center;
        }

        .cart-empty-icon {
          margin-bottom: 16px;
          font-size: 43px;
        }

        .cart-empty h2 {
          margin: 0;
          color: #172033;
          font-size: 22px;
        }

        .cart-empty p {
          margin: 12px 0 24px;
          color: #687386;
          font-size: 13px;
          line-height: 1.6;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(270px, 0.85fr);
          align-items: start;
          gap: 24px;
        }

        .cart-items-list {
          display: grid;
          gap: 15px;
          min-width: 0;
        }

        .cart-item-card {
          display: grid;
          grid-template-columns: 112px minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          box-sizing: border-box;
          min-width: 0;
          padding: 20px;
          border: 1px solid #e1e6ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 4px 18px rgba(25, 35, 55, 0.035);
        }

        .cart-item-image-wrap {
          display: grid;
          place-items: center;
          width: 112px;
          height: 112px;
          overflow: hidden;
          border: 1px solid #edf0f5;
          border-radius: 10px;
          background: #f8f9fc;
        }

        .cart-item-image {
          display: block;
          width: 100%;
          height: 100%;
          padding: 8px;
          box-sizing: border-box;
          object-fit: contain;
        }

        .cart-image-fallback {
          color: #d7193f;
          font-size: 35px;
          font-weight: 900;
        }

        .cart-item-info {
          min-width: 0;
        }

        .cart-item-category {
          display: block;
          margin-bottom: 8px;
          color: #d7193f;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .cart-item-info h2 {
          margin: 0;
          color: #172033;
          font-size: 16px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .cart-unit-price {
          margin: 9px 0 13px;
          color: #172033;
          font-size: 14px;
          font-weight: 700;
        }

        .cart-unit-price span {
          color: #7b8495;
          font-size: 12px;
          font-weight: 400;
        }

        .cart-item-controls {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
        }

        .cart-quantity-control {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          overflow: hidden;
          border: 1px solid #dce2eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .cart-quantity-control button {
          width: 34px;
          height: 34px;
          border: none;
          background: #f7f8fb;
          color: #172033;
          font-size: 19px;
          cursor: pointer;
        }

        .cart-quantity-control button:hover {
          background: #fff0f2;
          color: #d7193f;
        }

        .cart-quantity-control > span {
          min-width: 28px;
          color: #172033;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
        }

        .cart-remove-button {
          padding: 6px 0;
          border: none;
          background: transparent;
          color: #c62845;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .cart-remove-button:hover {
          color: #8e1029;
          text-decoration: underline;
        }

        .cart-item-total {
          align-self: start;
          padding-top: 4px;
          color: #172033;
          font-size: 15px;
          font-weight: 800;
          text-align: right;
          white-space: nowrap;
        }

        .cart-item-total small {
          display: block;
          margin-top: 7px;
          color: #7b8495;
          font-size: 10px;
          font-weight: 400;
        }

        .cart-summary {
          position: sticky;
          top: 20px;
          box-sizing: border-box;
          min-width: 0;
          padding: 24px;
          border: 1px solid #e1e6ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 5px 24px rgba(25, 35, 55, 0.045);
        }

        .cart-summary .section-kicker {
          margin-bottom: 10px;
        }

        .cart-summary h2 {
          margin: 0 0 24px;
          color: #172033;
          font-size: 21px;
        }

        .cart-summary-line {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 17px 0;
          color: #566174;
          font-size: 13px;
        }

        .cart-summary-line b {
          color: #172033;
          font-weight: 700;
          white-space: nowrap;
        }

        .cart-muted {
          max-width: 130px;
          color: #7b8495;
          text-align: right;
          font-size: 11px;
          line-height: 1.5;
        }

        .cart-summary-total {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #172033;
          font-size: 14px;
          font-weight: 700;
        }

        .cart-summary-total strong {
          color: #d7193f;
          font-size: 20px;
          white-space: nowrap;
        }

        .cart-summary-note {
          margin: 17px 0 22px;
          color: #7b8495;
          font-size: 11px;
          line-height: 1.7;
        }

        .cart-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-sizing: border-box;
          min-height: 46px;
          padding: 12px 19px;
          border: none;
          border-radius: 9px;
          background: #e31837;
          color: #ffffff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .cart-primary-button:hover {
          transform: translateY(-1px);
          background: #c8102e;
        }

        .cart-checkout-button {
          width: 100%;
        }

        .cart-continue-link {
          display: block;
          margin-top: 18px;
          color: #626f82;
          font-size: 12px;
          text-align: center;
          text-decoration: none;
        }

        .login-popup-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 20px;
          background: rgba(23, 32, 51, 0.45);
          backdrop-filter: blur(5px);
        }

        .login-popup {
          position: relative;
          width: 100%;
          max-width: 420px;
          box-sizing: border-box;
          padding: 36px 28px;
          border: 1px solid #e1e6ef;
          border-radius: 18px;
          background: #ffffff;
          color: #172033;
          box-shadow: 0 20px 70px rgba(25, 35, 55, 0.2);
          text-align: center;
        }

        .login-popup-close {
          position: absolute;
          top: 10px;
          right: 14px;
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #687386;
          font-size: 26px;
          cursor: pointer;
        }

        .login-popup-close:hover {
          background: #f5f7fb;
          color: #172033;
        }

        .login-popup-icon {
          margin-bottom: 12px;
          font-size: 42px;
        }

        .login-popup h2 {
          margin: 0 0 12px;
          color: #172033;
          font-size: 24px;
        }

        .login-popup > p {
          margin: 0 0 24px;
          color: #687386;
          font-size: 14px;
          line-height: 1.7;
        }

        .popup-link,
        .popup-register-link {
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: 100%;
          min-height: 46px;
          padding: 12px 16px;
          border-radius: 9px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .popup-register-link {
          margin-top: 12px;
          border: 1px solid #d6dce6;
          background: #ffffff;
          color: #374151;
        }

        .popup-register-link:hover {
          background: #f5f7fb;
        }

        .popup-cancel {
          margin-top: 18px;
          border: none;
          background: transparent;
          color: #687386;
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
        }

        .popup-cancel:hover {
          color: #d7193f;
        }

        @media (max-width: 850px) {
          .cart-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .cart-summary {
            position: static;
          }
        }

        @media (max-width: 560px) {
          .cart-page-header {
            min-height: 68px;
            padding: 12px 18px;
          }

          .cart-brand-mark {
            width: 38px;
            height: 38px;
          }

          .cart-brand-text b {
            font-size: 15px;
          }

          .cart-brand-text small {
            font-size: 8px;
            letter-spacing: 1px;
          }

          .cart-continue-top {
            max-width: 115px;
            font-size: 11px;
            text-align: right;
          }

          .cart-container {
            width: calc(100% - 28px);
            padding: 27px 0 45px;
          }

          .cart-title-row h1 {
            font-size: 29px;
          }

          .cart-item-card {
            grid-template-columns: 82px minmax(0, 1fr);
            gap: 13px;
            padding: 14px;
          }

          .cart-item-image-wrap {
            width: 82px;
            height: 82px;
          }

          .cart-item-info h2 {
            font-size: 14px;
          }

          .cart-item-total {
            grid-column: 2;
            justify-self: start;
            padding-top: 0;
            text-align: left;
          }

          .cart-item-total small {
            display: inline;
            margin-left: 7px;
          }

          .cart-item-controls {
            gap: 10px;
          }

          .cart-summary {
            padding: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cart-primary-button,
          .cart-quantity-control button {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

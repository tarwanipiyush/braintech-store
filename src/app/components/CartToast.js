"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

const money = (value) => "₹" + new Intl.NumberFormat("en-IN").format(value);
const SHOW_MS = 4500;

/* Popup shown whenever something is added to the cart, from any page.
   Several adds that happen together (a whole PC build, "add all") are merged into one popup. */
export default function CartToast() {
  const { cartCount } = useCart();
  const [toast, setToast] = useState(null);
  const batch = useRef([]);
  const flushTimer = useRef(null);
  const hideTimer = useRef(null);

  const armHide = useCallback((ms = SHOW_MS) => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setToast(null), ms);
  }, []);

  useEffect(() => {
    function flush() {
      const items = batch.current;
      batch.current = [];
      if (!items.length) return;

      const merged = new Map();
      for (const { product, quantity } of items) {
        const current = merged.get(product.id);
        merged.set(product.id, { product, quantity: (current?.quantity || 0) + quantity });
      }
      const lines = [...merged.values()];
      setToast({
        id: Date.now(),
        lines,
        count: lines.reduce((sum, l) => sum + l.quantity, 0),
        total: lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
      });
      armHide();
    }

    function onAdd(event) {
      batch.current.push(event.detail);
      window.clearTimeout(flushTimer.current);
      flushTimer.current = window.setTimeout(flush, 220);
    }

    window.addEventListener("braintech:cart-add", onAdd);
    return () => {
      window.removeEventListener("braintech:cart-add", onAdd);
      window.clearTimeout(flushTimer.current);
      window.clearTimeout(hideTimer.current);
    };
  }, [armHide]);

  if (!toast) return null;

  const single = toast.lines.length === 1;
  const first = toast.lines[0];

  return (
    <div className="ct-wrap" aria-live="polite">
      <div
        key={toast.id}
        className="ct-toast"
        role="status"
        onMouseEnter={() => window.clearTimeout(hideTimer.current)}
        onMouseLeave={() => armHide(2500)}
      >
        <div className="ct-thumbs">
          {toast.lines.slice(0, 3).map((line) => (
            <img key={line.product.id} src={line.product.image} alt="" />
          ))}
          <span className="ct-check">✓</span>
        </div>

        <div className="ct-copy">
          <b>{single ? "Added to your cart" : `${toast.count} items added to your cart`}</b>
          <span className="ct-name">
            {single
              ? `${first.product.name}${first.quantity > 1 ? ` × ${first.quantity}` : ""}`
              : `${first.product.name} and ${toast.lines.length - 1} more`}
          </span>
          <small>
            {money(toast.total)} · Your cart now has {cartCount} item{cartCount === 1 ? "" : "s"}
          </small>
        </div>

        <Link href="/cart" className="ct-view" onClick={() => setToast(null)}>
          View cart →
        </Link>
        <button type="button" className="ct-close" onClick={() => setToast(null)} aria-label="Dismiss notification">
          ✕
        </button>
      </div>
    </div>
  );
}
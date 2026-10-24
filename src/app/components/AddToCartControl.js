"use client";

import { useCart } from "@/context/CartContext";

/* One button: "Add to Cart".
   Once the item is in the cart it turns into  [ − ]  N IN CART  [ + ].
   Every add shows the popup (see CartToast). Pressing − at 1 removes the item and the button comes back. */
export default function AddToCartControl({ product, size = "md" }) {
  const { addToCart, updateQuantity, cart } = useCart();
  const inCart = cart.find((item) => item.id === product.id);
  const large = size === "lg" ? "cart-lg" : "";

  if (!inCart) {
    return (
      <button
        type="button"
        className={`add-cart-button cart-btn ${large}`}
        onClick={() => addToCart(product)}
      >
        ＋ Add to Cart
      </button>
    );
  }

  return (
    <div
      className={`card-quantity-control cart-bar ${large}`}
      role="group"
      aria-label={`Quantity of ${product.name} in your cart`}
    >
      <button
        type="button"
        onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span>
        <b>{inCart.quantity}</b>
        <small>IN CART</small>
      </span>

      <button
        type="button"
        onClick={() => addToCart(product)}
        aria-label="Increase quantity"
      >
        ＋
      </button>
    </div>
  );
}
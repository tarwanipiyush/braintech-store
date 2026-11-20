
"use client";

import { useCart } from "@/context/CartContext";

export default function AddToCartControl({ product, size = "md" }) {
  const { addToCart, updateQuantity, cart } = useCart();

  const stock = Number(
    product.stockQuantity ??
    product.stock_quantity ??
    product.stock ??
    0
  );

  const outOfStock = !Number.isFinite(stock) || stock <= 0;

  const inCart = cart.find(
    (item) => item.id === product.id
  );

  const large = size === "lg" ? "cart-lg" : "";

  if (outOfStock) {
    return (
      <button
        type="button"
        className={`add-cart-button cart-btn ${large} stock-unavailable-button`}
        disabled
      >
        OUT OF STOCK
      </button>
    );
  }

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
        onClick={() =>
          updateQuantity(product.id, inCart.quantity - 1)
        }
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
        disabled={inCart.quantity >= stock}
        onClick={() => addToCart(product)}
        aria-label="Increase quantity"
      >
        ＋
      </button>
    </div>
  );
}

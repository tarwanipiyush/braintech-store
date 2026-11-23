"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getProductImage = (product) => {
  if (typeof product.image === "string") return product.image;
  if (typeof product.imageUrl === "string") return product.imageUrl;
  if (Array.isArray(product.images) && typeof product.images[0] === "string") {
    return product.images[0];
  }
  return "";
};

export default function CheckoutReviewPage() {
  const router = useRouter();
  const {
  cart,
  cartTotal,
  cartCount,
  loaded,
  clearCart,
} = useCart();

  const [address, setAddress] = useState(null);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [codEnabled, setCodEnabled] = useState(false);
  const [standardShipping, setStandardShipping] = useState(0);
const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
const [appliedCoupon, setAppliedCoupon] = useState(null);
const [couponLoading, setCouponLoading] = useState(false);
const [couponError, setCouponError] = useState("");
const [couponMessage, setCouponMessage] = useState("");

const discountAmount =
  appliedCoupon && Number(appliedCoupon.subtotal) === Number(cartTotal)
    ? Number(appliedCoupon.discount_amount) || 0
    : 0;

const shippingCost =
  freeShippingThreshold > 0 && Number(cartTotal) >= freeShippingThreshold
    ? 0
    : standardShipping;

const payableTotal =
  Math.max(0, Number(cartTotal) - discountAmount) + shippingCost;
async function applyCoupon() {
  setCouponError("");
  setCouponMessage("");

  const code = couponCode.trim().toUpperCase();

  if (!code) {
    setCouponError("Please enter a coupon code.");
    return;
  }

  if (!cart.length || Number(cartTotal) <= 0) {
    setCouponError("Your cart is empty.");
    return;
  }

  setCouponLoading(true);

  try {
    const response = await fetch(
      "https://skilllynxedubridge.com/api/braintech/validate-coupon.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code,
          subtotal: Number(cartTotal),
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      setAppliedCoupon(null);
      throw new Error(result.message || "This coupon could not be applied.");
    }

    setAppliedCoupon({
      code,
      subtotal: Number(cartTotal),
      discount_amount: Number(result.discount_amount) || 0,
    });

    setCouponCode(code);
    setCouponMessage(result.message || "Coupon applied successfully.");
  } catch (err) {
    setCouponError(
      err instanceof Error
        ? err.message
        : "Unable to validate this coupon. Please try again."
    );
  } finally {
    setCouponLoading(false);
  }
}

function removeCoupon() {
  setAppliedCoupon(null);
  setCouponCode("");
  setCouponError("");
  setCouponMessage("");
}

  // Load the saved delivery address.
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem(
        "braintech-delivery-address"
      );

      if (savedAddress) {
        setAddress(JSON.parse(savedAddress));
      } else {
        setAddress(null);
      }
    } catch {
      setAddress(null);
    } finally {
      setAddressLoaded(true);
    }
  }, []);


// Load the COD preference from the database through the public API.
useEffect(() => {
  let cancelled = false;

  async function loadStoreSettings() {
    try {
      const response = await fetch("/api/store/settings", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || result.success !== true || !result.settings) {
        throw new Error("Unable to load store settings.");
      }

      if (!cancelled) {
        const enabled = result.settings.codEnabled === true;

        setCodEnabled(enabled);
        setStandardShipping(
  Math.max(0, Number(result.settings.standardShipping) || 0)
);

setFreeShippingThreshold(
  Math.max(0, Number(result.settings.freeShippingThreshold) || 0)
);

        if (!enabled) {
          setPaymentMethod((current) =>
            current === "cod" ? "upi" : current
          );
        }
      }
    } catch (error) {
      console.error("Checkout settings error:", error);

      if (!cancelled) {
        setCodEnabled(false);
        setStandardShipping(0);
setFreeShippingThreshold(0);
        setPaymentMethod((current) =>
          current === "cod" ? "upi" : current
        );
      }
    }
  }

  loadStoreSettings();

  return () => {
    cancelled = true;
  };
}, []);





  useEffect(() => {
    if (!loaded || !addressLoaded) return;

    if (!cart.length) {
      router.replace("/cart");
      return;
    }

    if (!address) {
      router.replace("/checkout");
    }
  }, [loaded, addressLoaded, cart.length, address, router]);



  async function placeOrder() {
    setError("");
    if (paymentMethod === "cod" && !codEnabled) {
  setError(
    "Cash on Delivery is currently unavailable. Please choose another payment method."
  );
  setPaymentMethod("upi");
  return;
}

    if (!address) {
      setError("Please add your delivery address before continuing.");
      return;
    }

    if (!cart.length) {
      setError("Your cart is empty. Please add products before placing an order.");
      return;
    }

    if (placingOrder) return;

    setPlacingOrder(true);

    try {
      const fullName =
        address.fullName ||
        address.name ||
        [address.firstName, address.lastName].filter(Boolean).join(" ");

const supabase = createClient();

const {
  data: { session },
  error: authError,
} = await supabase.auth.getSession();

if (authError || !session?.access_token || !session.user?.email) {
  throw new Error(
    "Please sign in to your account before placing this order."
  );
}

const customerEmail = session.user.email;

const customer = {
  name: fullName,
  email: customerEmail,
  phone: address.phone || address.mobile || "",
};

const response = await fetch(
  "/api/store/orders",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
  customer,
  address,
  paymentMethod,

  couponCode:
    appliedCoupon &&
    Number(appliedCoupon.subtotal) === Number(cartTotal)
      ? appliedCoupon.code
      : null,

  items: cart.map((item) => ({
    productId: Number(item.id),
    quantity: Number(item.quantity) || 1,
  })),
}),
  }
);


      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("The order server returned an invalid response.");
      }

      if (!response.ok || result.success !== true || !result.order) {
        throw new Error(
          result.message || "We couldn't place your order. Please try again."
        );
      }

      const savedOrder = result.order;

      // Preserve the order structure expected by the existing confirmation page.
      const order = {
        orderId: savedOrder.orderNumber,
        databaseOrderId: savedOrder.id,
        createdAt: new Date().toISOString(),
        items: cart.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 1,
        })),
        address,
        paymentMethod,
        subtotal: Number(savedOrder.subtotal),
shipping: Number(savedOrder.shippingCost) || 0,        total: Number(savedOrder.total),
        paymentStatus:
          paymentMethod === "cod"
            ? "Pay on delivery"
            : "Payment pending",
        orderStatus: "Order placed",
      };

      const savedOrders = localStorage.getItem("braintech-orders");
      const orders = savedOrders ? JSON.parse(savedOrders) : [];

      if (!Array.isArray(orders)) {
        throw new Error(
          "Your order was saved, but local order history is invalid."
        );
      }

      localStorage.setItem(
        "braintech-orders",
        JSON.stringify([order, ...orders])
      );

      localStorage.setItem(
        "braintech-latest-order",
        JSON.stringify(order)
      );

      clearCart();
      router.push("/checkout/confirmation");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't place your order. Please try again."
      );
      setPlacingOrder(false);
    }
  }



  if (!loaded || !addressLoaded || !cart.length || !address) {
    return (
      <main className="review-page review-loading">
        <div className="review-spinner" />
        <p>Preparing your order review...</p>
        <style>{`
          .review-page.review-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background: #f5f7fb;
            color: #172033;
            font-family: Arial, Helvetica, sans-serif;
          }
          .review-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #dce3ed;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: review-spin 0.8s linear infinite;
          }
          @keyframes review-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="review-page">
      <header className="review-header">
        <Link href="/" className="review-logo">
          BRAIN<span>TECH</span>
        </Link>

        <div className="review-secure">
          <span>🔒</span> Secure checkout
        </div>
      </header>

      <div className="review-progress">
        <div className="review-step review-complete">
          <span>✓</span>
          <p>Cart</p>
        </div>
        <div className="review-progress-line review-line-complete" />
        <div className="review-step review-complete">
          <span>✓</span>
          <p>Address</p>
        </div>
        <div className="review-progress-line" />
        <div className="review-step review-current">
          <span>3</span>
          <p>Review & Payment</p>
        </div>
        <div className="review-progress-line" />
        <div className="review-step">
          <span>4</span>
          <p>Confirmation</p>
        </div>
      </div>

      <div className="review-container">
        <div className="review-main">
          <section className="review-card">
            <div className="review-card-heading">
              <div>
                <span className="review-section-number">01</span>
                <h2>Delivery address</h2>
              </div>
              <Link href="/checkout" className="review-edit">
                Edit address
              </Link>
            </div>

            <div className="review-address">
              <div className="review-address-icon">⌂</div>
              <div>
                <strong>{address.fullName}</strong>
                <p>{address.address}</p>
                {address.landmark && <p>Landmark: {address.landmark}</p>}
                <p>
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p>Phone: {address.phone}</p>
              </div>
            </div>
          </section>

          <section className="review-card">
            <div className="review-card-heading">
              <div>
                <span className="review-section-number">02</span>
                <h2>Review your items</h2>
              </div>
              <Link href="/cart" className="review-edit">
                Edit cart
              </Link>
            </div>

            <p className="review-muted">
              {cartCount} {cartCount === 1 ? "item" : "items"} in your order
            </p>

            <div className="review-products">
              {cart.map((item) => {
                const image = getProductImage(item);

                return (
                  <div className="review-product" key={item.id}>
                    <div className="review-product-image">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={item.name || item.title || "Product"} />
                      ) : (
                        <div className="review-no-image">🖥️</div>
                      )}
                    </div>

                    <div className="review-product-info">
                      <h3>{item.name || item.title || "Product"}</h3>
                      <p>Quantity: {item.quantity}</p>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>

                    <div className="review-unit-price">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="review-card">
            <div className="review-card-heading">
              <div>
                <span className="review-section-number">03</span>
                <h2>Payment method</h2>
              </div>
            </div>

            <p className="review-muted">
              Choose how you would like to pay for your order.
            </p>

            <div className="review-payment-options">
              <button
                type="button"
                className={`review-payment-option ${
                  paymentMethod === "upi" ? "review-payment-selected" : ""
                }`}
                onClick={() => setPaymentMethod("upi")}
                aria-pressed={paymentMethod === "upi"}
              >
                <span className="review-payment-icon">↗</span>
                <span className="review-payment-text">
                  <strong>UPI</strong>
                  <small>Google Pay, PhonePe, Paytm or other UPI apps</small>
                </span>
                <span className="review-radio">
                  {paymentMethod === "upi" ? "●" : ""}
                </span>
              </button>

              <button
                type="button"
                className={`review-payment-option ${
                  paymentMethod === "card" ? "review-payment-selected" : ""
                }`}
                onClick={() => setPaymentMethod("card")}
                aria-pressed={paymentMethod === "card"}
              >
                <span className="review-payment-icon">▤</span>
                <span className="review-payment-text">
                  <strong>Credit or debit card</strong>
                  <small>Visa, Mastercard and supported cards</small>
                </span>
                <span className="review-radio">
                  {paymentMethod === "card" ? "●" : ""}
                </span>
              </button>


{codEnabled && (
  <button
    type="button"
    className={`review-payment-option ${
      paymentMethod === "cod" ? "review-payment-selected" : ""
    }`}
    onClick={() => setPaymentMethod("cod")}
    aria-pressed={paymentMethod === "cod"}
  >
    <span className="review-payment-icon">₹</span>
    <span className="review-payment-text">
      <strong>Cash on Delivery</strong>
      <small>Pay when your order is delivered</small>
    </span>
    <span className="review-radio">
      {paymentMethod === "cod" ? "●" : ""}
    </span>
  </button>
)}

            </div>


              <div className="review-payment-note">
                <span>ⓘ</span>
                <p>
                  Online payment has not been processed on this page. A payment
                  gateway must be connected to collect UPI or card payments.
                </p>
              </div>

          </section>
        </div>


<aside className="review-summary">
  <h2>Order summary</h2>

  <div className="review-coupon">
    <label htmlFor="checkout-coupon">Have a coupon code?</label>

    <div className="review-coupon-input">
      <input
        id="checkout-coupon"
        type="text"
        placeholder="Enter coupon code"
        value={couponCode}
        onChange={(e) => {
          setCouponCode(e.target.value.toUpperCase());
          setCouponError("");
          setCouponMessage("");
          if (appliedCoupon) setAppliedCoupon(null);
        }}
        disabled={couponLoading || placingOrder}
      />

      <button
        type="button"
        onClick={applyCoupon}
        disabled={couponLoading || placingOrder || !couponCode.trim()}
      >
        {couponLoading ? "Checking..." : "Apply"}
      </button>
    </div>

    {couponError && (
      <p className="review-coupon-error">{couponError}</p>
    )}

    {couponMessage && appliedCoupon && (
      <div className="review-coupon-success">
        <span>{couponMessage}</span>
        <button
          type="button"
          onClick={removeCoupon}
          disabled={placingOrder}
        >
          Remove
        </button>
      </div>
    )}
  </div>

  <div className="review-summary-row">
    <span>Items ({cartCount})</span>
    <strong>{formatPrice(cartTotal)}</strong>
  </div>

 <div className="review-summary-row">
  <span>Shipping</span>
  {shippingCost === 0 ? (
    <strong className="review-free">FREE</strong>
  ) : (
    <strong>{formatPrice(shippingCost)}</strong>
  )}
</div>

  <div className="review-summary-row">
    <span>Taxes</span>
    <span>Included in listed prices</span>
  </div>

  {discountAmount > 0 && (
    <div className="review-summary-row review-discount-row">
      <span>Coupon discount</span>
      <strong>-{formatPrice(discountAmount)}</strong>
    </div>
  )}

  <div className="review-summary-total">
    <span>Total</span>
    <strong>{formatPrice(payableTotal)}</strong>
  </div>

  <button
    type="button"
    className="review-place-order"
    onClick={placeOrder}
    disabled={placingOrder || couponLoading}
  >
    {placingOrder ? "Processing..." : "Place order"}
    {!placingOrder && <span>→</span>}
  </button>

  {error && <p className="review-error">{error}</p>}

  <p className="review-terms">
    By continuing, you confirm your delivery details and selected
    payment method.
  </p>

  <div className="review-trust">
    <span>🔒</span>
    <div>
      <strong>Your order details</strong>
      <p>Saved for the confirmation page on this device.</p>
    </div>
  </div>

  <Link href="/cart" className="review-back-cart">
    ← Return to cart
  </Link>
</aside>
</div>
 <footer className="review-footer">
        © {new Date().getFullYear()} BrainTech Store. All rights reserved.
      </footer>

      <style>{`
        .review-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
          padding-bottom: 24px;
        }

        .review-page * {
          box-sizing: border-box;
        }

        .review-page a {
          text-decoration: none;
        }

        .review-header {
          min-height: 76px;
          padding: 16px 6%;
          background: #fff;
          border-bottom: 1px solid #e5eaf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .review-logo {
          color: #111827;
          font-size: 25px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .review-logo span {
          color: #2563eb;
        }

        .review-secure {
          color: #526078;
          font-size: 13px;
          font-weight: 600;
        }

        .review-progress {
          max-width: 850px;
          margin: 30px auto 34px;
          padding: 0 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .review-step {
          width: 100px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #8a94a6;
          text-align: center;
        }

        .review-step > span {
          width: 34px;
          height: 34px;
          border: 2px solid #d9e0eb;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fff;
          font-size: 13px;
          font-weight: 700;
        }

        .review-step p {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
        }

        .review-complete {
          color: #15803d;
        }

        .review-complete > span {
          background: #dcfce7;
          border-color: #86efac;
        }

        .review-current {
          color: #1d4ed8;
          font-weight: 700;
        }

        .review-current > span {
          color: #fff;
          background: #2563eb;
          border-color: #2563eb;
        }

        .review-progress-line {
          height: 2px;
          flex: 1;
          max-width: 100px;
          margin-top: 16px;
          background: #d9e0eb;
        }

        .review-line-complete {
          background: #86efac;
        }

        .review-container {
          width: min(1180px, 92%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 350px;
          gap: 24px;
          align-items: start;
        }

        .review-main {
          display: grid;
          gap: 20px;
          min-width: 0;
        }

        .review-card,
        .review-summary {
          background: #fff;
          border: 1px solid #e3e8f0;
          border-radius: 14px;
          box-shadow: 0 5px 22px rgba(15, 23, 42, 0.035);
        }

        .review-card {
          padding: 25px;
        }

        .review-card-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .review-card-heading > div {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .review-section-number {
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
          background: #eff6ff;
          padding: 8px;
          border-radius: 8px;
        }

        .review-card-heading h2,
        .review-summary h2 {
          margin: 0;
          font-size: 19px;
          color: #172033;
        }

        .review-edit {
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .review-address {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          background: #f8fafc;
          border: 1px solid #e8edf5;
          border-radius: 10px;
        }

        .review-address-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #eaf1ff;
          color: #2563eb;
          font-size: 22px;
          flex-shrink: 0;
        }

        .review-address strong {
          display: block;
          margin-bottom: 7px;
          font-size: 15px;
        }

        .review-address p {
          margin: 4px 0;
          color: #596579;
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .review-muted {
          margin: -9px 0 20px;
          color: #748096;
          font-size: 13px;
        }

        .review-products {
          display: grid;
          gap: 0;
        }

        .review-product {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid #edf0f5;
          min-width: 0;
        }

        .review-product:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .review-product:last-child {
          padding-bottom: 0;
        }

        .review-product-image {
          width: 82px;
          height: 82px;
          border-radius: 10px;
          border: 1px solid #edf0f5;
          background: #f8fafc;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .review-product-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 5px;
        }

        .review-no-image {
          font-size: 28px;
        }

        .review-product-info {
          min-width: 0;
          flex: 1;
        }

        .review-product-info h3 {
          margin: 0 0 8px;
          color: #202b3d;
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .review-product-info p {
          margin: 0 0 8px;
          color: #778196;
          font-size: 12px;
        }

        .review-product-info strong {
          font-size: 14px;
          color: #172033;
        }

        .review-unit-price {
          color: #778196;
          font-size: 12px;
          white-space: nowrap;
        }

        .review-payment-options {
          display: grid;
          gap: 12px;
        }

        .review-payment-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: #fff;
          border: 1.5px solid #e0e6ef;
          border-radius: 11px;
          text-align: left;
          cursor: pointer;
          color: #172033;
          transition: border-color 0.2s, background 0.2s;
        }

        .review-payment-option:hover {
          border-color: #93b4ff;
        }

        .review-payment-selected {
          border-color: #2563eb;
          background: #f5f8ff;
        }

        .review-payment-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #edf3ff;
          color: #2563eb;
          font-size: 23px;
          font-weight: 700;
        }

        .review-payment-text {
          display: grid;
          gap: 6px;
          flex: 1;
        }

        .review-payment-text strong {
          font-size: 14px;
        }

        .review-payment-text small {
          color: #778196;
          font-size: 12px;
          line-height: 1.5;
        }

        .review-radio {
          width: 20px;
          height: 20px;
          border: 1.5px solid #cbd5e1;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #2563eb;
          font-size: 13px;
          flex-shrink: 0;
        }

        .review-payment-selected .review-radio {
          border-color: #2563eb;
        }

        .review-payment-note {
          margin-top: 16px;
          padding: 13px;
          display: flex;
          gap: 10px;
          background: #fff8e8;
          border: 1px solid #f8e2a8;
          border-radius: 9px;
          color: #8a5b08;
        }

        .review-payment-note p {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
        }

        .review-summary {
          padding: 25px;
          position: sticky;
          top: 20px;
        }

        .review-summary h2 {
          margin-bottom: 24px;
        }

        .review-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin: 17px 0;
          color: #657087;
          font-size: 13px;
        }

        .review-summary-row strong {
          color: #172033;
          white-space: nowrap;
        }

        .review-summary-row > span:last-child {
          text-align: right;
          max-width: 55%;
          font-size: 11px;
          line-height: 1.5;
        }

        .review-summary-row .review-free {
          color: #15803d;
          font-size: 12px;
        }

        .review-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 20px;
          margin-top: 22px;
          border-top: 1px solid #e8edf4;
          color: #172033;
          font-weight: 700;
        }

        .review-summary-total strong {
          font-size: 23px;
          white-space: nowrap;
        }

        .review-place-order {
          width: 100%;
          min-height: 52px;
          margin-top: 24px;
          padding: 13px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 0;
          border-radius: 10px;
          background: #2563eb;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .review-place-order:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .review-place-order:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .review-place-order span {
          font-size: 22px;
        }

        .review-error {
          margin: 12px 0 0;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.5;
        }

        .review-terms {
          color: #8791a3;
          font-size: 11px;
          line-height: 1.7;
          text-align: center;
          margin: 16px 0;
        }

        .review-trust {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #edf0f5;
        }

        .review-trust strong {
          color: #364257;
          font-size: 12px;
        }

        .review-trust p {
          margin: 5px 0 0;
          color: #8791a3;
          font-size: 11px;
          line-height: 1.5;
        }

        .review-back-cart {
          display: block;
          margin-top: 22px;
          color: #2563eb;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
        }

        .review-footer {
          margin-top: 40px;
          padding: 20px;
          border-top: 1px solid #e4e9f1;
          color: #8791a3;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .review-container {
            grid-template-columns: minmax(0, 1fr);
          }

          .review-summary {
            position: static;
          }
        }

        @media (max-width: 560px) {
          .review-header {
            padding: 15px 5%;
          }

          .review-logo {
            font-size: 21px;
          }

          .review-secure {
            font-size: 11px;
          }

          .review-progress {
            margin: 24px auto;
            padding: 0 8px;
          }

          .review-step {
            width: 76px;
          }

          .review-step p {
            font-size: 10px;
          }

          .review-progress-line {
            min-width: 8px;
          }

          .review-container {
            width: 94%;
            gap: 16px;
          }

          .review-card,
          .review-summary {
            padding: 18px;
            border-radius: 12px;
          }

          .review-card-heading h2,
          .review-summary h2 {
            font-size: 16px;
          }

          .review-card-heading {
            gap: 8px;
          }

          .review-card-heading > div {
            gap: 8px;
          }

          .review-edit {
            font-size: 11px;
          }

          .review-product {
            gap: 10px;
            flex-wrap: wrap;
          }

          .review-product-image {
            width: 66px;
            height: 66px;
          }

          .review-product-info h3 {
            font-size: 12px;
          }

          .review-unit-price {
            width: 100%;
            padding-left: 76px;
          }

          .review-payment-option {
            padding: 12px;
            gap: 10px;
          }

          .review-payment-icon {
            width: 36px;
            height: 36px;
          }

          .review-payment-text small {
            font-size: 11px;
          }
        }
      `}</style>
    </main>
  );
}
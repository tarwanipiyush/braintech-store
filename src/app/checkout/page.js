// BrainTech Store checkout page

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialAddress = {
  fullName: "",
  phone: "",
  pincode: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
};

const fields = [
  { name: "fullName", label: "Full name", placeholder: "Enter recipient's full name", required: true },
  { name: "phone", label: "Mobile number", placeholder: "10-digit mobile number", required: true },
  { name: "pincode", label: "PIN code", placeholder: "6-digit PIN code", required: true },
  { name: "address", label: "House / Flat, Street and Area", placeholder: "Enter your complete delivery address", required: true },
  { name: "landmark", label: "Landmark (optional)", placeholder: "Nearby landmark", required: false },
  { name: "city", label: "City", placeholder: "Enter city", required: true },
  { name: "state", label: "State", placeholder: "Enter state", required: true },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setAddress((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const phone = address.phone.replace(/\D/g, "");
    const pincode = address.pincode.replace(/\D/g, "");

    if (address.fullName.trim().length < 2) {
      setError("Please enter the recipient's full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (
      !address.address.trim() ||
      !address.city.trim() ||
      !address.state.trim()
    ) {
      setError("Please complete all required address fields.");
      return;
    }

    setSaving(true);

    try {
      const cleanAddress = {
        ...address,
        fullName: address.fullName.trim(),
        phone,
        pincode,
        address: address.address.trim(),
        landmark: address.landmark.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
      };

      localStorage.setItem(
        "braintech-delivery-address",
        JSON.stringify(cleanAddress)
      );

      router.push("/checkout/review");
    } catch {
      setError("Unable to save your address in this browser. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <Link href="/" className="checkout-brand">
          <span className="checkout-brand-icon">BT</span>
          <span>
            <strong>BrainTech</strong>
            <small>STORE</small>
          </span>
        </Link>

        <div className="checkout-secure">
          <span>✓</span> Checkout
        </div>
      </header>

      <div className="checkout-container">
        <div className="checkout-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/cart">Cart</Link>
          <span>/</span>
          <strong>Delivery Address</strong>
        </div>

        <div className="checkout-heading">
          <div>
            <span className="checkout-eyebrow">ALMOST THERE</span>
            <h1>Where should we deliver?</h1>
            <p>Enter the address where you want your order delivered.</p>
          </div>
          <div className="checkout-step">STEP 1 OF 3</div>
        </div>

        <div className="checkout-layout">
          <section className="checkout-form-card">
            <div className="checkout-card-heading">
              <div className="checkout-heading-icon">⌖</div>
              <div>
                <h2>Delivery details</h2>
                <p>Fields marked with * are required.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="checkout-fields">
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className={`checkout-field checkout-field-${field.name}`}
                  >
                    <label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span> *</span>}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={address[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      autoComplete={
                        {
                          fullName: "name",
                          phone: "tel",
                          pincode: "postal-code",
                          address: "street-address",
                          city: "address-level2",
                          state: "address-level1",
                        }[field.name] || "off"
                      }
                      maxLength={
                        field.name === "phone"
                          ? 10
                          : field.name === "pincode"
                            ? 6
                            : field.name === "fullName"
                              ? 100
                              : 200
                      }
                      inputMode={
                        field.name === "phone" ||
                        field.name === "pincode"
                          ? "numeric"
                          : "text"
                      }
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="checkout-error" role="alert">
                  {error}
                </div>
              )}

              <div className="checkout-form-note">
                <span>🔒</span>
                Your delivery details are saved in this browser for this
                checkout.
              </div>

              <div className="checkout-form-actions">
                <Link href="/cart" className="checkout-back-button">
                  ← Back to cart
                </Link>
                <button
                  type="submit"
                  className="checkout-continue-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Continue to review →"}
                </button>
              </div>
            </form>
          </section>

          <aside className="checkout-help-card">
            <div className="checkout-help-icon">📦</div>
            <h3>Delivery made simple</h3>
            <p>
              Double-check your address and PIN code to help ensure your
              order reaches the right place.
            </p>

            <div className="checkout-benefit">
              <span>✓</span>
              <div>
                <strong>Accurate delivery</strong>
                <small>Provide a complete address.</small>
              </div>
            </div>

            <div className="checkout-benefit">
              <span>✓</span>
              <div>
                <strong>Correct contact number</strong>
                <small>Use a number you can be reached on.</small>
              </div>
            </div>

            <div className="checkout-help-footer">
              Need help? Contact the store before placing your order.
            </div>
          </aside>
        </div>
      </div>

      <footer className="checkout-footer">
        © {new Date().getFullYear()} BrainTech Store
      </footer>

      <style jsx>{`
        .checkout-page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #172033;
  font-family: Arial, Helvetica, sans-serif;
}ut-header {
          height: 76px;
          padding: 0 clamp(18px, 5vw, 76px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #0e1421;
          border-bottom: 1px solid #222c3e;
        }

        .checkout-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: inherit;
          text-decoration: none;
        }

        .checkout-brand-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #20c5f5, #635bff);
          font-weight: 900;
          color: #fff;
        }

        .checkout-brand strong,
        .checkout-brand small {
          display: block;
        }

        .checkout-brand strong {
          font-size: 19px;
          letter-spacing: -0.5px;
        }

        .checkout-brand small {
          margin-top: 3px;
          color: #8d9ab0;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .checkout-secure {
          color: #b9c5d8;
          font-size: 13px;
        }

        .checkout-secure span {
          color: #42dba1;
          margin-right: 7px;
        }

        .checkout-container {
          width: min(1100px, calc(100% - 36px));
          margin: 0 auto;
          padding: 30px 0 60px;
        }

        .checkout-breadcrumb {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          color: #8492a8;
          font-size: 13px;
          margin-bottom: 32px;
        }

        .checkout-breadcrumb a {
          color: #aab8cc;
          text-decoration: none;
        }

        .checkout-breadcrumb a:hover {
          color: #36c8f4;
        }

        .checkout-breadcrumb strong {
          color: #f4f6fb;
        }

        .checkout-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .checkout-eyebrow {
          color: #37c8f3;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .checkout-heading h1 {
          margin: 9px 0;
          font-size: clamp(26px, 4vw, 36px);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .checkout-heading p {
          margin: 0;
          color: #9aa8bc;
          line-height: 1.6;
          font-size: 14px;
        }

        .checkout-step {
          flex-shrink: 0;
          padding: 9px 12px;
          border: 1px solid #2b3c54;
          border-radius: 8px;
          color: #a9bad1;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(240px, 0.85fr);
          align-items: start;
          gap: 22px;
        }

        .checkout-form-card,
        .checkout-help-card {
          background: #101725;
          border: 1px solid #263247;
          border-radius: 16px;
          padding: clamp(20px, 3vw, 30px);
        }

        .checkout-card-heading {
          display: flex;
          gap: 13px;
          align-items: center;
          margin-bottom: 27px;
        }

        .checkout-heading-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          color: #37c8f3;
          background: #132b3b;
          font-size: 27px;
        }

        .checkout-card-heading h2 {
          margin: 0 0 6px;
          font-size: 20px;
        }

        .checkout-card-heading p {
          margin: 0;
          color: #92a0b5;
          font-size: 12px;
        }

        .checkout-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 16px;
        }

        .checkout-field {
          min-width: 0;
        }

        .checkout-field-address {
          grid-column: 1 / -1;
        }

        .checkout-field label {
          display: block;
          margin-bottom: 9px;
          color: #d9e2ef;
          font-size: 13px;
          font-weight: 600;
        }

        .checkout-field label span {
          color: #38c9f4;
        }

        .checkout-field input {
          display: block;
          box-sizing: border-box;
          width: 100%;
          min-height: 47px;
          padding: 12px 13px;
          border: 1px solid #34435a;
          border-radius: 9px;
          outline: none;
          background: #0b111c;
          color: #f5f7fb;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .checkout-field input::placeholder {
          color: #68778d;
        }

        .checkout-field input:focus {
          border-color: #32bde9;
          box-shadow: 0 0 0 3px #32bde91a;
        }

        .checkout-error {
          margin-top: 20px;
          padding: 12px 14px;
          border: 1px solid #873f4c;
          border-radius: 8px;
          background: #351a24;
          color: #ffb8c2;
          font-size: 13px;
          line-height: 1.5;
        }

        .checkout-form-note {
          display: flex;
          gap: 9px;
          margin-top: 23px;
          color: #8f9fb5;
          font-size: 12px;
          line-height: 1.6;
        }

        .checkout-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 27px;
          padding-top: 22px;
          border-top: 1px solid #263247;
        }

        .checkout-back-button,
        .checkout-continue-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          min-height: 46px;
          padding: 0 17px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .checkout-back-button {
          border: 1px solid #35435a;
          color: #d3deed;
          background: transparent;
        }

        .checkout-continue-button {
          border: 0;
          color: #07111b;
          background: linear-gradient(100deg, #38d2f2, #69a6ff);
        }

        .checkout-continue-button:hover,
        .checkout-back-button:hover {
          transform: translateY(-1px);
        }

        .checkout-continue-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .checkout-help-card {
          padding: 25px;
        }

        .checkout-help-icon {
          display: grid;
          place-items: center;
          width: 51px;
          height: 51px;
          border-radius: 14px;
          background: #172a3b;
          font-size: 25px;
        }

        .checkout-help-card h3 {
          margin: 19px 0 10px;
          font-size: 19px;
        }

        .checkout-help-card > p {
          margin: 0;
          color: #96a5ba;
          font-size: 13px;
          line-height: 1.8;
        }

        .checkout-benefit {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          margin-top: 23px;
        }

        .checkout-benefit > span {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #153b34;
          color: #52e2ae;
          font-size: 13px;
        }

        .checkout-benefit strong,
        .checkout-benefit small {
          display: block;
        }

        .checkout-benefit strong {
          margin: 2px 0 5px;
          font-size: 12px;
        }

        .checkout-benefit small {
          color: #8998ad;
          font-size: 11px;
          line-height: 1.5;
        }

        .checkout-help-footer {
          margin-top: 25px;
          padding-top: 18px;
          border-top: 1px solid #293448;
          color: #8998ad;
          font-size: 11px;
          line-height: 1.7;
        }

        .checkout-footer {
          padding: 23px 18px;
          border-top: 1px solid #222c3e;
          color: #7f8da2;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 760px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }

          .checkout-help-card {
            order: 2;
          }
        }

        @media (max-width: 500px) {
          .checkout-header {
            height: 66px;
          }

          .checkout-container {
            padding-top: 22px;
          }

          .checkout-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .checkout-fields {
            grid-template-columns: 1fr;
          }

          .checkout-field-address {
            grid-column: auto;
          }

          .checkout-form-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .checkout-back-button,
          .checkout-continue-button {
            width: 100%;
            box-sizing: border-box;
          }
        }
          
/* Light theme overrides */
.checkout-page {
  background: #f5f7fb;
  color: #172033;
}

.checkout-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.checkout-brand {
  color: #172033;
}

.checkout-brand-icon {
  background: linear-gradient(135deg, #ef233c, #c8102e);
}

.checkout-brand small {
  color: #687386;
}

.checkout-secure {
  color: #566174;
}

.checkout-container {
  color: #172033;
}

.checkout-breadcrumb {
  color: #687386;
}

.checkout-breadcrumb a {
  color: #626f82;
}

.checkout-breadcrumb strong {
  color: #172033;
}

.checkout-heading h1 {
  color: #172033;
}

.checkout-heading p {
  color: #647084;
}

.checkout-step {
  background: #ffffff;
  border-color: #e0e5ed;
  color: #596579;
}

.checkout-form-card,
.checkout-help-card {
  background: #ffffff;
  border-color: #e3e7ee;
  box-shadow: 0 5px 22px rgba(25, 35, 55, 0.05);
}

.checkout-heading-icon {
  background: #fff0f2;
  color: #d7193f;
}

.checkout-card-heading h2,
.checkout-help-card h3 {
  color: #172033;
}

.checkout-card-heading p,
.checkout-help-card > p {
  color: #687386;
}

.checkout-field label {
  color: #303b4e;
}

.checkout-field label span {
  color: #d7193f;
}

.checkout-field input {
  background: #ffffff;
  color: #172033;
  border-color: #d6dce6;
}

.checkout-field input::placeholder {
  color: #929bad;
}

.checkout-field input:focus {
  border-color: #e11d48;
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.10);
}

.checkout-error {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.checkout-form-note {
  color: #687386;
}

.checkout-form-actions {
  border-top-color: #e5e7eb;
}

.checkout-back-button {
  border-color: #d6dce6;
  color: #374151;
  background: #ffffff;
}

.checkout-back-button:hover {
  background: #f5f6f9;
}

.checkout-continue-button {
  background: #e31837;
  color: #ffffff;
}

.checkout-continue-button:hover {
  background: #c8102e;
}

.checkout-help-icon {
  background: #fff0f2;
}

.checkout-benefit strong {
  color: #263247;
}

.checkout-benefit small {
  color: #687386;
}

.checkout-help-footer {
  border-top-color: #e5e7eb;
  color: #687386;
}

.checkout-footer {
  background: #ffffff;
  border-top-color: #e5e7eb;
  color: #687386;
}

.checkout-brand-icon {
  color: #ffffff;
}

.checkout-secure span {
  color: #16a36a;
}

      `}</style>
    </main>
  );
}

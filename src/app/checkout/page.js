"use client";

import { useEffect, useRef, useState } from "react";
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

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const autoCompleteValues = {
  fullName: "name",
  phone: "tel",
  pincode: "postal-code",
  address: "street-address",
  landmark: "off",
  city: "address-level2",
  state: "address-level1",
};

export default function CheckoutPage() {
  const router = useRouter();

  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pinStatus, setPinStatus] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  const lookupRequest = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("braintech-delivery-address");

      if (saved) {
        const parsed = JSON.parse(saved);
        setAddress({ ...initialAddress, ...parsed });
      }
    } catch {
      // Continue with a blank address if saved data cannot be read.
    }
  }, []);

  async function lookupPincode(pincode) {
    const requestId = ++lookupRequest.current;

    if (!/^\d{6}$/.test(pincode)) {
      setPinStatus("");
      setPinMessage("");
      return;
    }

    setPinStatus("loading");
    setPinMessage("Looking up your PIN code...");

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );

      if (!response.ok) {
        throw new Error("PIN lookup request failed");
      }

      const result = await response.json();

      // Ignore an older response if the user has changed the PIN code.
      if (requestId !== lookupRequest.current) return;

      const record = result?.[0];

      if (record?.Status !== "Success" || !record?.PostOffice?.length) {
        setPinStatus("error");
        setPinMessage(
          "PIN code not found. Please check it or enter your city and state manually."
        );
        return;
      }

      const postOffice = record.PostOffice[0];
      const district = postOffice.District || "";
      const state = postOffice.State || "";

      setAddress((previous) => ({
        ...previous,
        city: district || previous.city,
        state: indianStates.includes(state) ? state : previous.state,
      }));

      setPinStatus("success");
      setPinMessage(
        `Location found: ${district || postOffice.Name}${state ? `, ${state}` : ""}. Please confirm your details.`
      );
    } catch {
      if (requestId !== lookupRequest.current) return;

      setPinStatus("error");
      setPinMessage(
        "Unable to look up this PIN code right now. You can enter the city and state manually."
      );
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "pincode") {
      const pincode = value.replace(/\D/g, "").slice(0, 6);

      setAddress((previous) => ({
        ...previous,
        pincode,
      }));

      setError("");
      setPinStatus("");
      setPinMessage("");

      if (pincode.length === 6) {
        lookupPincode(pincode);
      } else {
        // Invalidate any request associated with an older PIN code.
        lookupRequest.current += 1;
      }

      return;
    }

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

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

    if (!indianStates.includes(address.state)) {
      setError("Please select a valid state or union territory.");
      return;
    }

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

    try {
      localStorage.setItem(
        "braintech-delivery-address",
        JSON.stringify(cleanAddress)
      );

      setSaving(true);
      router.push("/checkout/review");
    } catch {
      setError(
        "Unable to save your address in this browser. Please try again."
      );
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
          <span>✓</span> Secure checkout
        </div>
      </header>

      <div className="checkout-container">
        <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/cart">Cart</Link>
          <span>/</span>
          <strong>Delivery Address</strong>
        </nav>

        <div className="checkout-heading">
          <div>
            <span className="checkout-eyebrow">ALMOST THERE</span>
            <h1>Where should we deliver?</h1>
            <p>
              Enter your PIN code to help fill in your delivery location.
            </p>
          </div>

          <div className="checkout-step">STEP 1 OF 3</div>
        </div>

        <div className="checkout-layout">
          <section className="checkout-form-card">
            <div className="checkout-card-heading">
              <div className="checkout-heading-icon" aria-hidden="true">
                ⌖
              </div>

              <div>
                <h2>Delivery details</h2>
                <p>Fields marked with * are required.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="checkout-fields">
                <div className="checkout-field">
                  <label htmlFor="fullName">
                    Full name <span>*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="Enter recipient's full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="phone">
                    Mobile number <span>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={address.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="checkout-field checkout-field-pincode">
                  <label htmlFor="pincode">
                    PIN code <span>*</span>
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={address.pincode}
                    onChange={handleChange}
                    placeholder="Enter 6-digit PIN code"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    aria-describedby="pin-status"
                    required
                  />

                  {pinMessage && (
                    <p
                      id="pin-status"
                      className={`checkout-pin-message checkout-pin-${pinStatus}`}
                      role="status"
                      aria-live="polite"
                    >
                      {pinStatus === "loading" && (
                        <span className="checkout-pin-spinner" />
                      )}
                      {pinStatus === "success" && "✓ "}
                      {pinStatus === "error" && "⚠ "}
                      {pinMessage}
                    </p>
                  )}
                </div>

                <div className="checkout-field checkout-field-address">
                  <label htmlFor="address">
                    House / Flat, Street and Area <span>*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={address.address}
                    onChange={handleChange}
                    placeholder="Enter your complete delivery address"
                    autoComplete="street-address"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="landmark">Landmark (optional)</label>
                  <input
                    id="landmark"
                    name="landmark"
                    type="text"
                    value={address.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                    autoComplete="off"
                    maxLength={200}
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="city">
                    City / District <span>*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="Auto-filled from PIN code"
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="checkout-field checkout-field-state">
                  <label htmlFor="state">
                    State / Union territory <span>*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    autoComplete={autoCompleteValues.state}
                    required
                  >
                    <option value="">Select your state</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="checkout-error" role="alert">
                  {error}
                </div>
              )}

              <div className="checkout-form-note">
                <span aria-hidden="true">🔒</span>
                <span>
                  Your delivery details are saved in this browser for this
                  checkout.
                </span>
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
            <div className="checkout-help-icon" aria-hidden="true">
              📦
            </div>

            <h3>Delivery made simple</h3>

            <p>
              Enter your six-digit PIN code to look up your location. Always
              confirm the result before continuing.
            </p>

            <div className="checkout-benefit">
              <span>✓</span>
              <div>
                <strong>PIN code lookup</strong>
                <small>Automatically finds the postal district and state.</small>
              </div>
            </div>

            <div className="checkout-benefit">
              <span>✓</span>
              <div>
                <strong>Confirm your address</strong>
                <small>Add your house, street and area for accurate delivery.</small>
              </div>
            </div>

            <div className="checkout-help-footer">
              PIN lookup requires an internet connection. If it is unavailable,
              you can enter your location manually.
            </div>
          </aside>
        </div>
      </div>

      <footer className="checkout-footer">
        © {new Date().getFullYear()} BrainTech Store
      </footer>

      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .checkout-page *,
        .checkout-page *::before,
        .checkout-page *::after {
          box-sizing: border-box;
        }

        .checkout-header {
          min-height: 76px;
          padding: 14px clamp(18px, 5vw, 76px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .checkout-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #172033;
          text-decoration: none;
        }

        .checkout-brand-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ef233c, #c8102e);
          color: #ffffff;
          font-weight: 900;
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
          color: #687386;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .checkout-secure {
          color: #566174;
          font-size: 13px;
          white-space: nowrap;
        }

        .checkout-secure span {
          margin-right: 7px;
          color: #16a36a;
        }

        .checkout-container {
          width: min(1100px, calc(100% - 36px));
          margin: 0 auto;
          padding: 30px 0 60px;
        }

        .checkout-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 32px;
          color: #687386;
          font-size: 13px;
        }

        .checkout-breadcrumb a {
          color: #626f82;
          text-decoration: none;
        }

        .checkout-breadcrumb a:hover {
          color: #d7193f;
        }

        .checkout-breadcrumb strong {
          color: #172033;
        }

        .checkout-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .checkout-eyebrow {
          color: #d7193f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .checkout-heading h1 {
          margin: 9px 0;
          color: #172033;
          font-size: clamp(26px, 4vw, 36px);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .checkout-heading p {
          margin: 0;
          color: #647084;
          line-height: 1.6;
          font-size: 14px;
        }

        .checkout-step {
          flex-shrink: 0;
          padding: 9px 12px;
          border: 1px solid #e0e5ed;
          border-radius: 8px;
          background: #ffffff;
          color: #596579;
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
          min-width: 0;
          padding: clamp(20px, 3vw, 30px);
          border: 1px solid #e3e7ee;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 5px 22px rgba(25, 35, 55, 0.05);
        }

        .checkout-card-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 27px;
        }

        .checkout-heading-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fff0f2;
          color: #d7193f;
          font-size: 27px;
        }

        .checkout-card-heading h2 {
          margin: 0 0 6px;
          color: #172033;
          font-size: 20px;
        }

        .checkout-card-heading p {
          margin: 0;
          color: #687386;
          font-size: 12px;
        }

        .checkout-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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
          color: #303b4e;
          font-size: 13px;
          font-weight: 600;
        }

        .checkout-field label span {
          color: #d7193f;
        }

        .checkout-field input,
        .checkout-field select {
          display: block;
          width: 100%;
          min-height: 47px;
          padding: 12px 13px;
          border: 1px solid #d6dce6;
          border-radius: 9px;
          outline: none;
          background: #ffffff;
          color: #172033;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .checkout-field select {
          cursor: pointer;
        }

        .checkout-field input::placeholder {
          color: #929bad;
        }

        .checkout-field input:focus,
        .checkout-field select:focus {
          border-color: #e11d48;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1);
        }

        .checkout-pin-message {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          margin: 9px 0 0;
          font-size: 12px;
          line-height: 1.55;
        }

        .checkout-pin-loading {
          color: #475569;
        }

        .checkout-pin-success {
          color: #15803d;
        }

        .checkout-pin-error {
          color: #b45309;
        }

        .checkout-pin-spinner {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
          margin-top: 1px;
          border: 2px solid #cbd5e1;
          border-top-color: #475569;
          border-radius: 50%;
          animation: checkout-pin-spin 0.7s linear infinite;
        }

        @keyframes checkout-pin-spin {
          to { transform: rotate(360deg); }
        }

        .checkout-error {
          margin-top: 20px;
          padding: 12px 14px;
          border: 1px solid #fecdd3;
          border-radius: 8px;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          line-height: 1.5;
        }

        .checkout-form-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 23px;
          color: #687386;
          font-size: 12px;
          line-height: 1.6;
        }

        .checkout-form-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 27px;
          padding-top: 22px;
          border-top: 1px solid #e5e7eb;
        }

        .checkout-back-button,
        .checkout-continue-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 17px;
          border-radius: 9px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .checkout-back-button {
          border: 1px solid #d6dce6;
          background: #ffffff;
          color: #374151;
        }

        .checkout-continue-button {
          border: 0;
          background: #e31837;
          color: #ffffff;
        }

        .checkout-continue-button:hover {
          background: #c8102e;
        }

        .checkout-continue-button:hover,
        .checkout-back-button:hover {
          transform: translateY(-1px);
        }

        .checkout-continue-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .checkout-back-button:focus-visible,
        .checkout-continue-button:focus-visible {
          outline: 3px solid rgba(225, 29, 72, 0.25);
          outline-offset: 3px;
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
          background: #fff0f2;
          font-size: 25px;
        }

        .checkout-help-card h3 {
          margin: 19px 0 10px;
          color: #172033;
          font-size: 19px;
        }

        .checkout-help-card > p {
          margin: 0;
          color: #687386;
          font-size: 13px;
          line-height: 1.8;
        }

        .checkout-benefit {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 23px;
        }

        .checkout-benefit > span {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e6f7ef;
          color: #16845a;
          font-size: 13px;
        }

        .checkout-benefit strong,
        .checkout-benefit small {
          display: block;
        }

        .checkout-benefit strong {
          margin: 2px 0 5px;
          color: #263247;
          font-size: 12px;
        }

        .checkout-benefit small {
          color: #687386;
          font-size: 11px;
          line-height: 1.5;
        }

        .checkout-help-footer {
          margin-top: 25px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
          color: #687386;
          font-size: 11px;
          line-height: 1.7;
        }

        .checkout-footer {
          padding: 23px 18px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          color: #687386;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 760px) {
          .checkout-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .checkout-help-card {
            order: 2;
          }
        }

        @media (max-width: 500px) {
          .checkout-header {
            min-height: 66px;
          }

          .checkout-brand strong {
            font-size: 17px;
          }

          .checkout-secure {
            font-size: 11px;
          }

          .checkout-container {
            padding-top: 22px;
          }

          .checkout-breadcrumb {
            margin-bottom: 24px;
          }

          .checkout-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .checkout-fields {
            grid-template-columns: minmax(0, 1fr);
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
          }
        }
      `}</style>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import "../admin.css";

const STORAGE_KEY = "braintech-admin-settings-v1";

const defaultSettings = {
  storeName: "BrainTech Store",
  storeEmail: "",
  storePhone: "",
  address: "",
  city: "",
  state: "Maharashtra",
  postalCode: "",
  country: "India",
  currency: "INR",
  freeShippingThreshold: "5000",
  standardShipping: "99",
  estimatedDelivery: "3–7 business days",
  taxEnabled: false,
  taxRate: "18",
  codEnabled: false,
  maintenanceMode: false,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("store");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      setError("Could not load saved settings from this browser.");
    } finally {
      setLoaded(true);
    }
  }, []);

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function saveSettings(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!settings.storeName.trim()) {
      setError("Please enter a store name.");
      setActiveSection("store");
      return;
    }

    if (
      settings.storeEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.storeEmail)
    ) {
      setError("Please enter a valid store email address.");
      setActiveSection("store");
      return;
    }

    const shipping = Number(settings.standardShipping);
    const threshold = Number(settings.freeShippingThreshold);
    const taxRate = Number(settings.taxRate);

    if (!Number.isFinite(shipping) || shipping < 0) {
      setError("Standard shipping must be zero or greater.");
      setActiveSection("shipping");
      return;
    }

    if (!Number.isFinite(threshold) || threshold < 0) {
      setError("The free-shipping threshold must be zero or greater.");
      setActiveSection("shipping");
      return;
    }

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 100
    ) {
      setError("Tax rate must be between 0 and 100.");
      setActiveSection("checkout");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setMessage("Settings saved successfully in this browser.");
    } catch {
      setError("Could not save settings. Check available browser storage.");
    }
  }

  function resetSettings() {
    const confirmed = window.confirm(
      "Reset all settings to their default values? Your saved settings will be replaced."
    );

    if (!confirmed) return;

    setSettings(defaultSettings);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      setMessage("Settings have been reset to defaults.");
      setError("");
    } catch {
      setError("Could not save the default settings.");
    }
  }

  if (!loaded) {
    return <main className="store-settings-page">Loading settings...</main>;
  }

  const sections = [
    { id: "store", label: "Store information", icon: "▣" },
    { id: "shipping", label: "Shipping", icon: "⇢" },
    { id: "checkout", label: "Tax & checkout", icon: "₹" },
    { id: "operations", label: "Store operations", icon: "⚙" },
  ];

  return (
    <main className="store-settings-page">
      <header className="store-settings-header">
        <div>
          <p className="store-settings-eyebrow">STORE CONFIGURATION</p>
          <h1>Settings</h1>
          <p>Manage your BrainTech Store preferences.</p>
        </div>

        <div className="store-settings-header-actions">
          <button
            type="button"
            className="store-settings-btn secondary"
            onClick={resetSettings}
          >
            Reset defaults
          </button>

          <button
            type="submit"
            form="store-settings-form"
            className="store-settings-btn primary"
          >
            Save settings
          </button>
        </div>
      </header>

      <div className="store-settings-notice">
        <strong>Local settings</strong>
        <span>
          These settings are stored in this browser only. They do not change
          live checkout, shipping, taxes, or storefront behaviour yet.
        </span>
      </div>

      {message && (
        <div className="store-settings-success">{message}</div>
      )}

      {error && <div className="store-settings-error">{error}</div>}

      <div className="store-settings-layout">
        <nav className="store-settings-nav" aria-label="Settings sections">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? "active" : ""}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <form
          id="store-settings-form"
          className="store-settings-content"
          onSubmit={saveSettings}
        >
          {activeSection === "store" && (
            <section className="store-settings-card">
              <div className="store-settings-card-heading">
                <h2>Store information</h2>
                <p>Basic contact details for your online store.</p>
              </div>

              <div className="store-settings-grid">
                <div className="store-settings-field full">
                  <label htmlFor="storeName">Store name *</label>
                  <input
                    id="storeName"
                    value={settings.storeName}
                    onChange={(e) => updateField("storeName", e.target.value)}
                    required
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="storeEmail">Store email</label>
                  <input
                    id="storeEmail"
                    type="email"
                    placeholder="support@example.com"
                    value={settings.storeEmail}
                    onChange={(e) => updateField("storeEmail", e.target.value)}
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="storePhone">Phone number</label>
                  <input
                    id="storePhone"
                    type="tel"
                    placeholder="+91..."
                    value={settings.storePhone}
                    onChange={(e) => updateField("storePhone", e.target.value)}
                  />
                </div>

                <div className="store-settings-field full">
                  <label htmlFor="address">Street address</label>
                  <input
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Enter your business address"
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    value={settings.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    value={settings.state}
                    onChange={(e) => updateField("state", e.target.value)}
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="postalCode">PIN code</label>
                  <input
                    id="postalCode"
                    value={settings.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    value={settings.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="currency">Store currency</label>
                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                  >
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {activeSection === "shipping" && (
            <section className="store-settings-card">
              <div className="store-settings-card-heading">
                <h2>Shipping settings</h2>
                <p>Configure your intended delivery and shipping defaults.</p>
              </div>

              <div className="store-settings-grid">
                <div className="store-settings-field">
                  <label htmlFor="standardShipping">
                    Standard shipping charge (₹)
                  </label>
                  <input
                    id="standardShipping"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.standardShipping}
                    onChange={(e) =>
                      updateField("standardShipping", e.target.value)
                    }
                  />
                </div>

                <div className="store-settings-field">
                  <label htmlFor="freeShippingThreshold">
                    Free shipping above (₹)
                  </label>
                  <input
                    id="freeShippingThreshold"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.freeShippingThreshold}
                    onChange={(e) =>
                      updateField("freeShippingThreshold", e.target.value)
                    }
                  />
                  <small>
                    Enter 0 if you intend to offer free shipping on every order.
                  </small>
                </div>

                <div className="store-settings-field full">
                  <label htmlFor="estimatedDelivery">
                    Estimated delivery time
                  </label>
                  <input
                    id="estimatedDelivery"
                    value={settings.estimatedDelivery}
                    onChange={(e) =>
                      updateField("estimatedDelivery", e.target.value)
                    }
                    placeholder="e.g. 3–7 business days"
                  />
                </div>
              </div>
            </section>
          )}

          {activeSection === "checkout" && (
            <section className="store-settings-card">
              <div className="store-settings-card-heading">
                <h2>Tax & checkout</h2>
                <p>Set intended tax and payment preferences for future integration.</p>
              </div>

              <label className="store-settings-toggle">
                <span>
                  <strong>Enable tax calculation</strong>
                  <small>
                    Preference only; no tax will be calculated at checkout yet.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.taxEnabled}
                  onChange={(e) =>
                    updateField("taxEnabled", e.target.checked)
                  }
                />
              </label>

              <div className="store-settings-grid single-top">
                <div className="store-settings-field">
                  <label htmlFor="taxRate">Tax rate (%)</label>
                  <input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => updateField("taxRate", e.target.value)}
                  />
                  <small>
                    Confirm the applicable rate and product-specific tax
                    treatment with your tax adviser before using this for real
                    orders.
                  </small>
                </div>
              </div>

              <div className="store-settings-divider" />

              <div className="store-settings-card-heading">
                <h2>Payment methods</h2>
                <p>Choose which payment methods you intend to offer.</p>
              </div>

              <label className="store-settings-toggle">
                <span>
                  <strong>Cash on Delivery (COD)</strong>
                  <small>
                    Turn this on when you want to allow customers to pay when
                    their order is delivered. This preference is currently
                    saved in this browser only.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.codEnabled}
                  onChange={(e) =>
                    updateField("codEnabled", e.target.checked)
                  }
                />
              </label>

              <div className="store-settings-info">
                <strong>Payment integration pending</strong>
                <p>
                  This COD toggle saves your preference in this browser. It
                  does not yet control checkout or enforce payment availability
                  on the server. We will connect it to checkout and shared
                  backend storage next.
                </p>
              </div>
            </section>
          )}

          {activeSection === "operations" && (
            <section className="store-settings-card">
              <div className="store-settings-card-heading">
                <h2>Store operations</h2>
                <p>Preferences for future store administration.</p>
              </div>

              <label className="store-settings-toggle">
                <span>
                  <strong>Maintenance mode preference</strong>
                  <small>
                    Saves your preference only. It does not take the live store
                    offline.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    updateField("maintenanceMode", e.target.checked)
                  }
                />
              </label>

              <div className="store-settings-info">
                <strong>Backend integration pending</strong>
                <p>
                  These settings must be connected to shared backend storage
                  and the relevant checkout/storefront logic before they affect
                  customers.
                </p>
              </div>
            </section>
          )}

          <div className="store-settings-bottom-actions">
            <span>Remember to save after making changes.</span>
            <button
              type="submit"
              className="store-settings-btn primary"
            >
              Save settings
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

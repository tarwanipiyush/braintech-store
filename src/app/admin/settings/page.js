
"use client";

import { useEffect, useState } from "react";
import "../admin.css";

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
  standardShipping: "0",
  estimatedDelivery: "3–7 business days",
  taxEnabled: false,
  taxRate: "18",
  codEnabled: false,
  maintenanceMode: false,
};

async function settingsRequest(method = "GET", body = null) {
  const token = localStorage.getItem("braintech-admin-token");

  if (!token) {
    throw new Error("Admin session not found. Please log in again.");
  }

  const response = await fetch("/api/admin/settings", {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    ...(body ? { body: JSON.stringify({ settings: body }) } : {}),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Unable to process store settings."
    );
  }

  return data;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("store");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const data = await settingsRequest("GET");

        if (!cancelled) {
          setSettings({
            ...defaultSettings,
            ...data.settings,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load settings.");
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  async function saveSettings(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (saving) return;

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

    setSaving(true);

    try {
      const data = await settingsRequest("PUT", settings);

      setSettings({
        ...defaultSettings,
        ...data.settings,
      });

      setMessage("Settings saved successfully to the database.");
    } catch (err) {
      setError(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function resetSettings() {
    const confirmed = window.confirm(
      "Reset all store settings to their default values in the database? This will affect the shared store configuration."
    );

    if (!confirmed || saving) return;

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const data = await settingsRequest("PUT", defaultSettings);

      setSettings({
        ...defaultSettings,
        ...data.settings,
      });

      setMessage("Store settings have been reset successfully.");
    } catch (err) {
      setError(err.message || "Could not reset settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <main className="store-settings-page">
        Loading settings from the database...
      </main>
    );
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
          <p>Manage your BrainTech Store configuration.</p>
        </div>

        <div className="store-settings-header-actions">
          <button
            type="button"
            className="store-settings-btn secondary"
            onClick={resetSettings}
            disabled={saving}
          >
            Reset defaults
          </button>

          <button
            type="submit"
            form="store-settings-form"
            className="store-settings-btn primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </header>

      <div className="store-settings-notice">
        <strong>Connected to database</strong>
        <span>
          Settings are loaded from and saved to the shared BrainTech Store
          database. Customer-facing behaviour still depends on the relevant
          checkout and order API integrations.
        </span>
      </div>

      {message && (
        <div className="store-settings-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="store-settings-error" role="alert">
          {error}
        </div>
      )}

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
                <p>Configure your store's shipping defaults.</p>
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
                    Enter 0 if you intend to offer free shipping on every
                    order.
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

              <div className="store-settings-info">
                <strong>Shipping integration</strong>
                <p>
                  These values are stored centrally. We still need to connect
                  the shipping calculation in checkout and order creation
                  before they affect customer orders.
                </p>
              </div>
            </section>
          )}

          {activeSection === "checkout" && (
            <section className="store-settings-card">
              <div className="store-settings-card-heading">
                <h2>Tax & checkout</h2>
                <p>Configure tax and payment preferences.</p>
              </div>

              <label className="store-settings-toggle">
                <span>
                  <strong>Enable tax calculation</strong>
                  <small>
                    Stores your tax preference. Checkout tax calculation still
                    needs to be connected and verified.
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
                    Confirm applicable GST rates and product-specific tax
                    treatment before applying tax to real orders.
                  </small>
                </div>
              </div>

              <div className="store-settings-divider" />

              <div className="store-settings-card-heading">
                <h2>Payment methods</h2>
                <p>Choose which payment methods your store should offer.</p>
              </div>

              <label className="store-settings-toggle">
                <span>
                  <strong>Cash on Delivery (COD)</strong>
                  <small>
                    Enable or disable COD for the store. We will enforce this
                    setting in checkout and on the order server.
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
                <strong>COD server enforcement</strong>
                <p>
                  The setting is now saved in the shared database. The next
                  integration step is to make checkout display the correct
                  payment option and make the order API reject COD orders
                  whenever this setting is disabled.
                </p>
              </div>
            </section>
          )}

          {activeSection === "operations" && (
            <section className="store-settings-card">
              <div className="store-settings-card-heading">
                <h2>Store operations</h2>
                <p>Manage operational preferences.</p>
              </div>

              <label className="store-settings-toggle">
                <span>
                  <strong>Maintenance mode</strong>
                  <small>
                    Stores the maintenance preference. It does not yet take
                    the live storefront offline.
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
                <strong>Storefront integration pending</strong>
                <p>
                  Maintenance mode must be connected to the storefront before
                  it can restrict customer access.
                </p>
              </div>
            </section>
          )}

          <div className="store-settings-bottom-actions">
            <span>
              {saving
                ? "Saving changes to the database..."
                : "Changes are saved to the shared database."}
            </span>

            <button
              type="submit"
              className="store-settings-btn primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

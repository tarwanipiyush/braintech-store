
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const API_URL =
  "https://skilllynxedubridge.com/api/braintech/customer-addresses.php";

const EMPTY_ADDRESS = {
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  address_type: "home",
  is_default: false,
};

const FIELDS = [
  { name: "recipient_name", label: "Full Name", required: true },
  { name: "phone", label: "Phone Number", required: true },
  { name: "address_line1", label: "Address Line 1", required: true },
  { name: "address_line2", label: "Address Line 2", required: false },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State", required: true },
  { name: "postal_code", label: "PIN Code", required: true },
  { name: "country", label: "Country", required: true },
];

export default function MyAddressesPage() {
  const [supabase] = useState(() => createClient());

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_ADDRESS });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const apiRequest = useCallback(
    async (method, body = null) => {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!data.session) {
        throw new Error("Please sign in to manage your addresses.");
      }

      const response = await fetch(API_URL, {
        method,
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to complete your request.");
      }

      return result;
    },
    [supabase]
  );

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiRequest("GET");
      setAddresses(result.addresses || []);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  function openNewForm() {
    setForm({ ...EMPTY_ADDRESS });
    setEditingId(null);
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(address) {
    setForm({
      ...address,
      is_default: Number(address.is_default) === 1,
    });
    setEditingId(address.id);
    setMessage("");
    setShowForm(true);
  }

  function handleFieldChange(event) {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const payload = editingId
        ? { ...form, id: editingId }
        : form;

      await apiRequest(editingId ? "PUT" : "POST", payload);

      setShowForm(false);
      setForm({ ...EMPTY_ADDRESS });
      setEditingId(null);

      setMessage(
        editingId
          ? "Your address has been updated successfully."
          : "Your new address has been saved successfully."
      );
      setMessageType("success");

      await loadAddresses();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(address) {
    try {
      setMessage("");

      await apiRequest("PUT", {
        ...address,
        is_default: true,
      });

      setMessage("Default address updated successfully.");
      setMessageType("success");

      await loadAddresses();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      setMessage("");

      await apiRequest("DELETE", { id });

      setMessage("Address deleted successfully.");
      setMessageType("success");

      await loadAddresses();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  }

  return (
    <main className="bt-address-page">
      <div className="bt-address-container">
        <div className="bt-address-heading">
          <div>
            <span className="bt-address-kicker">MY ACCOUNT</span>
            <h1>Saved Addresses</h1>
            <p>
              Manage your delivery addresses for a faster checkout.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              className="bt-address-primary"
              onClick={openNewForm}
            >
              <span>＋</span> Add New Address
            </button>
          )}
        </div>

        {message && (
          <div
            className={`bt-address-message ${messageType}`}
            role="status"
          >
            {message}
          </div>
        )}

        {showForm && (
          <form className="bt-address-form" onSubmit={handleSubmit}>
            <div className="bt-address-form-heading">
              <div>
                <span className="bt-address-kicker">
                  DELIVERY DETAILS
                </span>
                <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>
              </div>
            </div>

            <div className="bt-address-fields">
              {FIELDS.map((field) => (
                <label
                  className={`bt-address-field ${
                    field.name === "address_line1" ||
                    field.name === "address_line2"
                      ? "wide"
                      : ""
                  }`}
                  key={field.name}
                >
                  <span>{field.label}</span>
                  <input
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleFieldChange}
                    required={field.required}
                    maxLength={
                      field.name === "phone" ? 30 : 255
                    }
                    autoComplete="off"
                  />
                </label>
              ))}

              <label className="bt-address-field">
                <span>Address Type</span>
                <select
                  name="address_type"
                  value={form.address_type}
                  onChange={handleFieldChange}
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label className="bt-address-default-check">
              <input
                type="checkbox"
                name="is_default"
                checked={Boolean(form.is_default)}
                onChange={handleFieldChange}
              />
              <span>Set as my default delivery address</span>
            </label>

            <div className="bt-address-form-actions">
              <button
                type="submit"
                className="bt-address-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Address"
                    : "Save Address"}
              </button>

              <button
                type="button"
                className="bt-address-secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="bt-address-loading">
            <span className="bt-address-spinner" />
            Loading your saved addresses...
          </div>
        ) : addresses.length === 0 ? (
          <div className="bt-address-empty">
            <div className="bt-address-empty-icon">⌖</div>
            <h2>No saved addresses yet</h2>
            <p>
              Add your delivery address to make your next purchase
              quicker and easier.
            </p>
            {!showForm && (
              <button
                type="button"
                className="bt-address-primary"
                onClick={openNewForm}
              >
                ＋ Add Your First Address
              </button>
            )}
          </div>
        ) : (
          <div className="bt-address-grid">
            {addresses.map((address) => (
              <article className="bt-address-card" key={address.id}>
                <div className="bt-address-card-top">
                  <div className="bt-address-person">
                    <span className="bt-address-avatar">♙</span>
                    <div>
                      <h2>{address.recipient_name}</h2>
                      <span className="bt-address-type">
                        {address.address_type || "Home"} Address
                      </span>
                    </div>
                  </div>

                  {Number(address.is_default) === 1 && (
                    <span className="bt-address-default-badge">
                      DEFAULT
                    </span>
                  )}
                </div>

                <div className="bt-address-details">
                  <p>{address.address_line1}</p>

                  {address.address_line2 && (
                    <p>{address.address_line2}</p>
                  )}

                  <p>
                    {address.city}, {address.state} - {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                </div>

                <div className="bt-address-phone">
                  <span>☎</span> {address.phone}
                </div>

                <div className="bt-address-card-actions">
                  <button
                    type="button"
                    className="bt-address-action"
                    onClick={() => openEditForm(address)}
                  >
                    Edit
                  </button>

                  {Number(address.is_default) !== 1 && (
                    <button
                      type="button"
                      className="bt-address-action"
                      onClick={() => handleSetDefault(address)}
                    >
                      Set Default
                    </button>
                  )}

                  <button
                    type="button"
                    className="bt-address-action danger"
                    onClick={() => handleDelete(address.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

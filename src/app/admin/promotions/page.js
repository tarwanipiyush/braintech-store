
"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialForm() {
  return {
    code: "",
    name: "",
    type: "Percentage",
    value: "10",
    minimum: "0",
    usageLimit: "100",
    startDate: getToday(),
    endDate: "",
  };
}

function normalizePromotion(promo) {
  return {
    ...promo,
    id: Number(promo.id),
    code: promo.code || "",
    name: promo.name || promo.description || "",
    type: promo.type || "Percentage",
    value: Number(promo.value || 0),
    minimum: Number(promo.minimumOrder ?? promo.minimum_order_amount ?? 0),
    usageLimit:
      promo.usageLimit == null
        ? 0
        : Number(promo.usageLimit),
    used: Number(promo.used ?? promo.usage_count ?? 0),
    redemptionCount: Number(promo.redemption_count || 0),
    startDate: promo.startDate || "",
    endDate: promo.endDate || "",
    is_active: Number(promo.is_active) === 1,
    status:
      promo.status === "Limit reached"
        ? "Used up"
        : promo.status || "Active",
  };
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [form, setForm] = useState(getInitialForm);

  async function apiRequest(method = "GET", payload = null) {
    const token = localStorage.getItem("braintech-admin-token");

    if (!token) {
      throw new Error("Admin session not found. Please log in again.");
    }

    const response = await fetch("/api/admin/promotions", {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  function showMessage(message, isError = false) {
    setNotice(message);
    setNoticeError(isError);
  }

  async function loadPromotions() {
    setLoading(true);

    try {
      const data = await apiRequest("GET");
      setPromotions(
        Array.isArray(data.promotions)
          ? data.promotions.map(normalizePromotion)
          : []
      );
    } catch (error) {
      console.error("Could not load promotions:", error);
      showMessage(error.message, true);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  const filteredPromotions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promotions.filter((promo) => {
      const matchesSearch =
        !query ||
        promo.code.toLowerCase().includes(query) ||
        promo.name.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All" || promo.status === statusFilter)
      );
    });
  }, [promotions, search, statusFilter]);

  const activeCount = promotions.filter(
    (promo) => promo.status === "Active"
  ).length;

  const totalUses = promotions.reduce(
    (sum, promo) => sum + promo.redemptionCount,
    0
  );

  const percentageCount = promotions.filter(
    (promo) => promo.type === "Percentage"
  ).length;

  function changeForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(getInitialForm());
    setShowForm(true);
    showMessage("");
  }

  function editPromotion(promo) {
    setEditingId(promo.id);

    setForm({
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value: String(promo.value),
      minimum: String(promo.minimum),
      usageLimit: String(promo.usageLimit),
      startDate: promo.startDate,
      endDate: promo.endDate,
    });

    setShowForm(true);
    showMessage("");
  }

  async function savePromotion(event) {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const value = Number(form.value);
    const minimum = Number(form.minimum);
    const usageLimit = Number(form.usageLimit);

    if (!code || !name) {
      showMessage("Enter a promotion name and discount code.", true);
      return;
    }

    if (!/^[A-Z0-9_-]{2,80}$/.test(code)) {
      showMessage(
        "Use 2–80 letters, numbers, hyphens or underscores for the code.",
        true
      );
      return;
    }

    if (
      promotions.some(
        (promo) =>
          promo.code.toUpperCase() === code &&
          promo.id !== editingId
      )
    ) {
      showMessage("That discount code already exists.", true);
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      showMessage("Discount value must be greater than zero.", true);
      return;
    }

    if (form.type === "Percentage" && value > 100) {
      showMessage("Percentage discount cannot exceed 100%.", true);
      return;
    }

    if (
      !Number.isFinite(minimum) ||
      minimum < 0 ||
      !Number.isInteger(usageLimit) ||
      usageLimit < 0
    ) {
      showMessage("Check the minimum order amount and usage limit.", true);
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      showMessage("End date cannot be earlier than the start date.", true);
      return;
    }

    const previous = promotions.find(
      (promo) => promo.id === editingId
    );

    const payload = {
      code,
      name,
      type: form.type,
      value,
      minimumOrder: minimum,
      usageLimit: usageLimit === 0 ? null : usageLimit,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      is_active: previous ? previous.is_active : true,
    };

    if (editingId !== null) {
      payload.id = editingId;
    }

    setSaving(true);

    try {
      const result = await apiRequest(
        editingId !== null ? "PUT" : "POST",
        payload
      );

      await loadPromotions();

      setShowForm(false);
      setEditingId(null);
      setForm(getInitialForm());

      showMessage(
        result.message ||
          (editingId !== null
            ? "Promotion updated successfully."
            : "Promotion created successfully.")
      );
    } catch (error) {
      console.error("Could not save promotion:", error);
      showMessage(error.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(promo) {
    const nextActive = !promo.is_active;

    setActionId(promo.id);

    try {
      const result = await apiRequest("PUT", {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: promo.value,
        minimumOrder: promo.minimum,
        usageLimit:
          promo.usageLimit === 0 ? null : promo.usageLimit,
        startDate: promo.startDate || null,
        endDate: promo.endDate || null,
        is_active: nextActive,
      });

      await loadPromotions();
      showMessage(result.message || `${promo.code} updated successfully.`);
    } catch (error) {
      console.error("Could not update promotion:", error);
      showMessage(error.message, true);
    } finally {
      setActionId(null);
    }
  }

  async function deletePromotion(promo) {
    const confirmed = window.confirm(
      `Delete promotion ${promo.code}? This cannot be undone.`
    );

    if (!confirmed) return;

    setActionId(promo.id);

    try {
      const result = await apiRequest("DELETE", {
        id: promo.id,
      });

      await loadPromotions();
      showMessage(result.message || `${promo.code} deleted successfully.`);
    } catch (error) {
      console.error("Could not delete promotion:", error);
      showMessage(error.message, true);
    } finally {
      setActionId(null);
    }
  }

  function exportPromotions() {
    const headers = [
      "Code",
      "Name",
      "Type",
      "Value",
      "Minimum Order",
      "Usage Limit",
      "Used",
      "Redemptions",
      "Start Date",
      "End Date",
      "Status",
    ];

    const rows = promotions.map((promo) => [
      promo.code,
      promo.name,
      promo.type,
      promo.value,
      promo.minimum,
      promo.usageLimit === 0 ? "Unlimited" : promo.usageLimit,
      promo.used,
      promo.redemptionCount,
      promo.startDate,
      promo.endDate,
      promo.status,
    ]);

    const quote = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(quote).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "braintech-promotions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return <main className="promotions-page">Loading promotions...</main>;
  }

  return (
    <main className="promotions-page">
      <header className="promotions-header">
        <div>
          <p className="promotions-eyebrow">BRAINTECH STORE / ADMIN</p>
          <h1>Promotions</h1>
          <p className="promotions-subtitle">
            Create discount codes and manage promotional offers.
          </p>
        </div>

        <div className="promotions-header-actions">
          <button
            type="button"
            className="promotions-secondary-button"
            onClick={exportPromotions}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="promotions-primary-button"
            onClick={openNewForm}
          >
            + Create promotion
          </button>
        </div>
      </header>

      {notice && (
        <div
          className="promotions-notice"
          role="status"
          style={noticeError ? { borderColor: "#dc5555" } : undefined}
        >
          {notice}
        </div>
      )}

      <section className="promotions-stats">
        <article className="promotions-stat-card">
          <span>Total promotions</span>
          <strong>{promotions.length}</strong>
          <small>Saved offers and discount codes</small>
        </article>

        <article className="promotions-stat-card">
          <span>Active promotions</span>
          <strong>{activeCount}</strong>
          <small>Currently within their offer period</small>
        </article>

        <article className="promotions-stat-card">
          <span>Total redemptions</span>
          <strong>{totalUses.toLocaleString("en-IN")}</strong>
          <small>Recorded coupon redemptions</small>
        </article>

        <article className="promotions-stat-card">
          <span>Percentage offers</span>
          <strong>{percentageCount}</strong>
          <small>Percentage-based discounts</small>
        </article>
      </section>

      {showForm && (
        <form className="promotions-form" onSubmit={savePromotion}>
          <div className="promotions-form-heading">
            <div>
              <h2>{editingId !== null ? "Edit promotion" : "Create promotion"}</h2>
              <p>Set the discount, minimum order, and validity period.</p>
            </div>

            <button
              type="button"
              className="promotions-close-button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <div className="promotions-form-grid">
            <label>
              Promotion name *
              <input
                name="name"
                value={form.name}
                onChange={changeForm}
                placeholder="e.g. Gaming Weekend Sale"
                required
              />
            </label>

            <label>
              Discount code *
              <input
                name="code"
                value={form.code}
                onChange={changeForm}
                placeholder="e.g. GAMING10"
                required
              />
            </label>

            <label>
              Discount type
              <select name="type" value={form.type} onChange={changeForm}>
                <option>Percentage</option>
                <option>Fixed amount</option>
              </select>
            </label>

            <label>
              Discount value *
              <input
                name="value"
                type="number"
                min="0.01"
                max={form.type === "Percentage" ? "100" : undefined}
                step="0.01"
                value={form.value}
                onChange={changeForm}
                required
              />
            </label>

            <label>
              Minimum order amount (₹)
              <input
                name="minimum"
                type="number"
                min="0"
                step="1"
                value={form.minimum}
                onChange={changeForm}
              />
            </label>

            <label>
              Usage limit (0 = unlimited)
              <input
                name="usageLimit"
                type="number"
                min="0"
                step="1"
                value={form.usageLimit}
                onChange={changeForm}
              />
            </label>

            <label>
              Start date
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={changeForm}
              />
            </label>

            <label>
              End date
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={changeForm}
              />
            </label>
          </div>

          <p className="promotions-form-hint">
            {form.type === "Percentage"
              ? `Customers receive ${Number(form.value) || 0}% off eligible orders.`
              : `Customers receive ${formatPrice(form.value)} off eligible orders.`}
          </p>

          <div className="promotions-form-actions">
            <button
              type="button"
              className="promotions-secondary-button"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="promotions-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "Create promotion"}
            </button>
          </div>
        </form>
      )}

      <section className="promotions-panel">
        <div className="promotions-toolbar">
          <div>
            <h2>All promotions</h2>
            <p>Review offers, usage, and status.</p>
          </div>

          <input
            type="search"
            className="promotions-search"
            placeholder="Search code or promotion..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="promotions-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter promotions by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Expired">Expired</option>
            <option value="Used up">Used up</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        <div className="promotions-table-wrap">
          <table className="promotions-table">
            <thead>
              <tr>
                <th>Promotion</th>
                <th>Code</th>
                <th>Discount</th>
                <th>Minimum order</th>
                <th>Usage</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPromotions.map((promo) => {
                const limit = promo.usageLimit;
                const used = promo.used;

                const usagePercent =
                  limit > 0
                    ? Math.min(100, (used / limit) * 100)
                    : 0;

                return (
                  <tr key={promo.id}>
                    <td>
                      <div className="promotions-name">
                        <strong>{promo.name}</strong>
                        <small>#{promo.id}</small>
                      </div>
                    </td>

                    <td>
                      <span className="promotions-code">{promo.code}</span>
                    </td>

                    <td>
                      <strong>
                        {promo.type === "Percentage"
                          ? `${promo.value}%`
                          : formatPrice(promo.value)}
                      </strong>
                    </td>

                    <td>{formatPrice(promo.minimum)}</td>

                    <td>
                      <div className="promotions-usage">
                        <div className="promotions-usage-text">
                          <span>{used}</span>
                          <span>{limit > 0 ? limit : "Unlimited"}</span>
                        </div>

                        <div className="promotions-progress">
                          <span style={{ width: `${usagePercent}%` }} />
                        </div>
                      </div>
                    </td>

                    <td>{promo.endDate || "No end date"}</td>

                    <td>
                      <span
                        className={`promotions-status ${promo.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {promo.status}
                      </span>
                    </td>

                    <td>
                      <div className="promotions-row-actions">
                        <button
                          type="button"
                          className="promotions-edit-button"
                          onClick={() => editPromotion(promo)}
                          disabled={actionId === promo.id}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="promotions-toggle-button"
                          onClick={() => togglePromotion(promo)}
                          disabled={actionId === promo.id}
                        >
                          {actionId === promo.id
                            ? "Saving..."
                            : promo.is_active
                              ? "Disable"
                              : "Enable"}
                        </button>

                        <button
                          type="button"
                          className="promotions-delete-button"
                          onClick={() => deletePromotion(promo)}
                          disabled={actionId === promo.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPromotions.length === 0 && (
                <tr>
                  <td colSpan={8} className="promotions-empty">
                    {loading
                      ? "Loading promotions..."
                      : "No promotions match your search or filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="promotions-footer">
          Showing {filteredPromotions.length} of {promotions.length} promotions
        </footer>
      </section>

      <p className="promotions-storage-note">
        Promotions are loaded from the BrainTech database. Checkout discount
        validation and redemption tracking must be connected separately.
      </p>
    </main>
  );
}

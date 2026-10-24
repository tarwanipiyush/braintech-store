
"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const STORAGE_KEY = "braintech-admin-promotions-v1";

const INITIAL_PROMOTIONS = [
  {
    id: "PROMO-1001",
    code: "WELCOME10",
    name: "Welcome Offer",
    type: "Percentage",
    value: 10,
    minimum: 1000,
    usageLimit: 500,
    used: 42,
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    status: "Active",
  },
  {
    id: "PROMO-1002",
    code: "GAMING500",
    name: "Gaming Gear Discount",
    type: "Fixed amount",
    value: 500,
    minimum: 5000,
    usageLimit: 200,
    used: 28,
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    status: "Active",
  },
  {
    id: "PROMO-1003",
    code: "FESTIVE15",
    name: "Festive Sale",
    type: "Percentage",
    value: 15,
    minimum: 10000,
    usageLimit: 100,
    used: 100,
    startDate: "2026-09-01",
    endDate: "2026-10-15",
    status: "Expired",
  },
];

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function getInitialForm() {
  return {
    code: "",
    name: "",
    type: "Percentage",
    value: "10",
    minimum: "0",
    usageLimit: "100",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  };
}

function getEffectiveStatus(promo) {
  if (promo.status === "Disabled") return "Disabled";

  const today = new Date().toISOString().slice(0, 10);

  if (promo.endDate && promo.endDate < today) return "Expired";
  if (promo.startDate && promo.startDate > today) return "Scheduled";
  if (
    Number(promo.usageLimit) > 0 &&
    Number(promo.used) >= Number(promo.usageLimit)
  ) {
    return "Used up";
  }

  return "Active";
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setPromotions(saved ? JSON.parse(saved) : INITIAL_PROMOTIONS);
    } catch (error) {
      console.error("Could not load promotions:", error);
      setPromotions(INITIAL_PROMOTIONS);
    }

    setLoaded(true);
  }, []);

  function persistPromotions(nextPromotions, message) {
    setPromotions(nextPromotions);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPromotions));
      setNotice(message);
    } catch (error) {
      console.error("Could not save promotions:", error);
      setNotice("Could not save changes. Browser storage may be full.");
    }
  }

  const filteredPromotions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promotions.filter((promo) => {
      const matchesSearch =
        !query ||
        String(promo.code).toLowerCase().includes(query) ||
        String(promo.name).toLowerCase().includes(query);

      const status = getEffectiveStatus(promo);

      return (
        matchesSearch &&
        (statusFilter === "All" || status === statusFilter)
      );
    });
  }, [promotions, search, statusFilter]);

  const activeCount = promotions.filter(
    (promo) => getEffectiveStatus(promo) === "Active"
  ).length;

  const totalUses = promotions.reduce(
    (sum, promo) => sum + Number(promo.used || 0),
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
    setNotice("");
  }

  function editPromotion(promo) {
    setEditingId(promo.id);
    setForm({
      code: promo.code || "",
      name: promo.name || "",
      type: promo.type || "Percentage",
      value: String(promo.value ?? 10),
      minimum: String(promo.minimum ?? 0),
      usageLimit: String(promo.usageLimit ?? 100),
      startDate: promo.startDate || "",
      endDate: promo.endDate || "",
    });
    setShowForm(true);
    setNotice("");
  }

  function savePromotion(event) {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const value = Number(form.value);
    const minimum = Number(form.minimum);
    const usageLimit = Number(form.usageLimit);

    if (!code || !name) {
      setNotice("Enter a promotion name and discount code.");
      return;
    }

    if (
      promotions.some(
        (promo) =>
          promo.code.toUpperCase() === code && promo.id !== editingId
      )
    ) {
      setNotice("That discount code already exists.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setNotice("Discount value must be greater than zero.");
      return;
    }

    if (
      form.type === "Percentage" &&
      value > 100
    ) {
      setNotice("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      !Number.isFinite(minimum) ||
      minimum < 0 ||
      !Number.isInteger(usageLimit) ||
      usageLimit < 0
    ) {
      setNotice("Check the minimum order amount and usage limit.");
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setNotice("End date cannot be earlier than the start date.");
      return;
    }

    const previous = promotions.find((promo) => promo.id === editingId);

    const nextPromo = {
      id: editingId || `PROMO-${Date.now()}`,
      code,
      name,
      type: form.type,
      value,
      minimum,
      usageLimit,
      used: previous?.used || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      status: previous?.status === "Disabled" ? "Disabled" : "Active",
    };

    const nextPromotions = editingId
      ? promotions.map((promo) =>
          promo.id === editingId ? nextPromo : promo
        )
      : [nextPromo, ...promotions];

    persistPromotions(
      nextPromotions,
      editingId ? "Promotion updated." : "Promotion created."
    );

    setShowForm(false);
    setEditingId(null);
    setForm(getInitialForm());
  }

  function togglePromotion(promo) {
    const currentStatus = getEffectiveStatus(promo);
    const nextStatus =
      currentStatus === "Disabled" ? "Active" : "Disabled";

    const next = promotions.map((item) =>
      item.id === promo.id ? { ...item, status: nextStatus } : item
    );

    persistPromotions(
      next,
      `${promo.code} ${nextStatus.toLowerCase()}.`
    );
  }

  function deletePromotion(promo) {
    const confirmed = window.confirm(
      `Delete promotion ${promo.code}? This cannot be undone.`
    );

    if (!confirmed) return;

    persistPromotions(
      promotions.filter((item) => item.id !== promo.id),
      `${promo.code} deleted.`
    );
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
      promo.usageLimit,
      promo.used,
      promo.startDate,
      promo.endDate,
      getEffectiveStatus(promo),
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
        <div className="promotions-notice" role="status">
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
          <small>Sample recorded uses</small>
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
              <h2>{editingId ? "Edit promotion" : "Create promotion"}</h2>
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
              <select
                name="type"
                value={form.type}
                onChange={changeForm}
              >
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className="promotions-primary-button"
            >
              {editingId ? "Save changes" : "Create promotion"}
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
                const status = getEffectiveStatus(promo);
                const limit = Number(promo.usageLimit) || 0;
                const used = Number(promo.used) || 0;
                const usagePercent =
                  limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

                return (
                  <tr key={promo.id}>
                    <td>
                      <div className="promotions-name">
                        <strong>{promo.name}</strong>
                        <small>{promo.id}</small>
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
                        className={`promotions-status ${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>
                      <div className="promotions-row-actions">
                        <button
                          type="button"
                          className="promotions-edit-button"
                          onClick={() => editPromotion(promo)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="promotions-toggle-button"
                          onClick={() => togglePromotion(promo)}
                        >
                          {promo.status === "Disabled"
                            ? "Enable"
                            : "Disable"}
                        </button>

                        <button
                          type="button"
                          className="promotions-delete-button"
                          onClick={() => deletePromotion(promo)}
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
                    No promotions match your search or filter.
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
        Frontend preview only. Promotions are stored in this browser and
        are not yet applied at checkout. Discount validation and usage
        tracking will be connected to the backend later.
      </p>
    </main>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status) {
  return String(status).toLowerCase();
}

function normalizeCustomer(item) {
  const addresses = Array.isArray(item.addresses) ? item.addresses : [];
  const defaultAddress =
    addresses.find((address) => Number(address.is_default) === 1) ||
    addresses[0] ||
    null;

  return {
    id: String(item.id),
    name: item.full_name || "",
    email: item.email || "",
    phone: item.phone || "",
    city: defaultAddress?.city || "",
    joined: item.created_at || "",
    orders: Number(item.total_orders || 0),
    spent: Number(item.total_spent || 0),
    status: Number(item.is_active) === 1 ? "Active" : "Inactive",
    addresses,
    orderHistory: Array.isArray(item.order_history)
      ? item.order_history
      : [],
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notice, setNotice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  function getToken() {
    return localStorage.getItem("braintech-admin-token");
  }

  async function loadCustomers() {
    const token = getToken();

    if (!token) {
      setNotice("Admin session not found. Please log in again.");
      setLoaded(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/customers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load customers.");
      }

      const normalized = (data.customers || []).map(normalizeCustomer);

      setCustomers(normalized);

      setSelectedCustomer((current) => {
        if (!current) return null;

        return (
          normalized.find((customer) => customer.id === current.id) || null
        );
      });

      setNotice("");
    } catch (error) {
      console.error("Customers loading error:", error);
      setNotice(error.message || "Unable to load customers.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.city.toLowerCase().includes(query) ||
        customer.id.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All" || customer.status === statusFilter)
      );
    });
  }, [customers, search, statusFilter]);

  const totalSpent = customers.reduce(
    (sum, customer) => sum + customer.spent,
    0
  );

  const repeatCustomers = customers.filter(
    (customer) => customer.orders > 1
  ).length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function addCustomer(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name || !email) {
      setNotice("Customer name and email are required.");
      return;
    }

    const token = getToken();

    if (!token) {
      setNotice("Admin session not found. Please log in again.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create customer.");
      }

      setForm({
        name: "",
        email: "",
        phone: "",
      });

      setShowAddForm(false);

      await loadCustomers();
      setNotice("Customer added successfully.");
    } catch (error) {
      console.error("Customer creation error:", error);
      setNotice(error.message || "Could not add customer.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(customer) {
    const token = getToken();

    if (!token) {
      setNotice("Admin session not found. Please log in again.");
      return;
    }

    const updatedStatus =
      customer.status === "Active" ? "Inactive" : "Active";

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(customer.id),
          is_active: updatedStatus === "Active" ? 1 : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update customer.");
      }

      await loadCustomers();
      setNotice(
        `${customer.name} is now ${updatedStatus.toLowerCase()}.`
      );
    } catch (error) {
      console.error("Customer status update error:", error);
      setNotice(error.message || "Could not update customer status.");
    } finally {
      setLoading(false);
    }
  }

  function exportCustomers() {
    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "City",
      "Joined",
      "Orders",
      "Total Spent INR",
      "Status",
    ];

    const rows = customers.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.city,
      customer.joined,
      customer.orders,
      customer.spent,
      customer.status,
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
    link.download = "braintech-customers.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return <main className="customers-page">Loading customers...</main>;
  }

  return (
    <main className="customers-page">
      <header className="customers-header">
        <div>
          <p className="customers-eyebrow">BRAINTECH STORE / ADMIN</p>
          <h1>Customers</h1>
          <p className="customers-subtitle">
            Manage customer profiles and review their purchase activity.
          </p>
        </div>

        <div className="customers-header-actions">
          <button
            type="button"
            className="customers-secondary-button"
            onClick={exportCustomers}
            disabled={loading}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="customers-primary-button"
            onClick={() => {
              setShowAddForm((value) => !value);
              setNotice("");
            }}
          >
            {showAddForm ? "Cancel" : "+ Add customer"}
          </button>
        </div>
      </header>

      {notice && (
        <div className="customers-notice" role="status">
          {notice}
        </div>
      )}

      {showAddForm && (
        <form className="customers-add-form" onSubmit={addCustomer}>
          <div className="customers-form-heading">
            <h2>Add customer</h2>
            <p>
              Create a customer profile. Saved delivery addresses can be
              managed separately.
            </p>
          </div>

          <div className="customers-form-grid">
            <label>
              Full name *
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Customer name"
                required
              />
            </label>

            <label>
              Email *
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="customer@example.com"
                required
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="+91..."
              />
            </label>
          </div>

          <button
            className="customers-primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save customer"}
          </button>
        </form>
      )}

      <section className="customers-stats">
        <article className="customers-stat-card">
          <span>Total customers</span>
          <strong>{customers.length}</strong>
          <small>Database customer profiles</small>
        </article>

        <article className="customers-stat-card">
          <span>Active customers</span>
          <strong>{activeCustomers}</strong>
          <small>Currently marked active</small>
        </article>

        <article className="customers-stat-card">
          <span>Repeat customers</span>
          <strong>{repeatCustomers}</strong>
          <small>More than one order</small>
        </article>

        <article className="customers-stat-card">
          <span>Total spend</span>
          <strong>{formatPrice(totalSpent)}</strong>
          <small>Across recorded customer orders</small>
        </article>
      </section>

      <section className="customers-panel">
        <div className="customers-toolbar">
          <div>
            <h2>Customer directory</h2>
            <p>Search profiles or filter by status.</p>
          </div>

          <input
            className="customers-search"
            type="search"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="customers-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter customers by status"
          >
            <option value="All">All customers</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {loading && (
          <p className="customers-notice">Updating customer records...</p>
        )}

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customers-person">
                      <div className="customers-avatar">
                        {customer.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0] || "")
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{customer.name}</strong>
                        <small>{customer.email}</small>
                      </div>
                    </div>
                  </td>

                  <td>{customer.phone || "—"}</td>
                  <td>{customer.city || "—"}</td>
                  <td>{formatDate(customer.joined)}</td>
                  <td>{customer.orders}</td>
                  <td>
                    <strong>{formatPrice(customer.spent)}</strong>
                  </td>

                  <td>
                    <span
                      className={`customers-status ${statusClass(
                        customer.status
                      )}`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td>
                    <div className="customers-row-actions">
                      <button
                        type="button"
                        className="customers-view-button"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="customers-toggle-button"
                        onClick={() => toggleStatus(customer)}
                        disabled={loading}
                      >
                        {customer.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="customers-empty">
                    {loading
                      ? "Loading customer records..."
                      : "No customers match your search or filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="customers-footer">
          Showing {filteredCustomers.length} of {customers.length} customers
        </footer>
      </section>

      {selectedCustomer && (
        <div
          className="customers-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCustomer(null);
            }
          }}
        >
          <section
            className="customers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customers-modal-title"
          >
            <header className="customers-modal-header">
              <div>
                <p className="customers-eyebrow">CUSTOMER PROFILE</p>
                <h2 id="customers-modal-title">
                  {selectedCustomer.name}
                </h2>
              </div>

              <button
                type="button"
                className="customers-close-button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer details"
              >
                ×
              </button>
            </header>

            <div className="customers-profile-grid">
              <div>
                <span>Customer ID</span>
                <strong>{selectedCustomer.id}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedCustomer.email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedCustomer.phone || "Not provided"}</strong>
              </div>
              <div>
                <span>Default city</span>
                <strong>{selectedCustomer.city || "Not provided"}</strong>
              </div>
              <div>
                <span>Joined</span>
                <strong>{formatDate(selectedCustomer.joined)}</strong>
              </div>
              <div>
                <span>Order count</span>
                <strong>{selectedCustomer.orders}</strong>
              </div>
              <div>
                <span>Total spent</span>
                <strong>{formatPrice(selectedCustomer.spent)}</strong>
              </div>
              <div>
                <span>Account status</span>
                <strong>{selectedCustomer.status}</strong>
              </div>
            </div>

            <div className="customers-profile-section">
              <h3>Saved addresses</h3>

              {selectedCustomer.addresses.length === 0 ? (
                <p>No saved addresses found.</p>
              ) : (
                selectedCustomer.addresses.map((address) => (
                  <article key={address.id} className="customers-address-card">
                    <strong>
                      {address.recipient_name}
                      {Number(address.is_default) === 1 && " · Default"}
                    </strong>
                    <p>
                      {address.address_line1}
                      {address.address_line2
                        ? `, ${address.address_line2}`
                        : ""}
                      {`, ${address.city}, ${address.state} - ${address.postal_code}`}
                      {`, ${address.country}`}
                    </p>
                    <small>
                      {address.phone} · {address.address_type}
                    </small>
                  </article>
                ))
              )}
            </div>

            <div className="customers-profile-section">
              <h3>Order history</h3>

              {selectedCustomer.orderHistory.length === 0 ? (
                <p>No orders found for this customer.</p>
              ) : (
                <div className="customers-table-wrap">
                  <table className="customers-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orderHistory.map((order) => (
                        <tr key={order.id}>
                          <td>{order.order_number || order.id}</td>
                          <td>{formatDate(order.created_at)}</td>
                          <td>{Number(order.item_count || 0)}</td>
                          <td>{formatPrice(order.total)}</td>
                          <td>{order.payment_status || "—"}</td>
                          <td>{order.order_status || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              type="button"
              className="customers-primary-button customers-done-button"
              onClick={() => setSelectedCustomer(null)}
            >
              Done
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

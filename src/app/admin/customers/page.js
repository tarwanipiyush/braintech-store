
"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const STORAGE_KEY = "braintech-admin-customers-v1";

const INITIAL_CUSTOMERS = [
  {
    id: "CUS-1001",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
    city: "Mumbai",
    joined: "2026-10-12",
    orders: 4,
    spent: 98500,
    status: "Active",
  },
  {
    id: "CUS-1002",
    name: "Priya Patel",
    email: "priya@example.com",
    phone: "+91 98765 12345",
    city: "Pune",
    joined: "2026-10-14",
    orders: 2,
    spent: 42999,
    status: "Active",
  },
  {
    id: "CUS-1003",
    name: "Rahul Verma",
    email: "rahul@example.com",
    phone: "+91 99887 77665",
    city: "Bengaluru",
    joined: "2026-10-15",
    orders: 1,
    spent: 72999,
    status: "Active",
  },
  {
    id: "CUS-1004",
    name: "Sneha Desai",
    email: "sneha@example.com",
    phone: "+91 98765 67890",
    city: "Nashik",
    joined: "2026-10-16",
    orders: 0,
    spent: 0,
    status: "Active",
  },
  {
    id: "CUS-1005",
    name: "Ishaan Mehta",
    email: "ishaan@example.com",
    phone: "+91 97654 32109",
    city: "Delhi",
    joined: "2026-10-17",
    orders: 3,
    spent: 56750,
    status: "Inactive",
  },
];

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function statusClass(status) {
  return String(status).toLowerCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notice, setNotice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setCustomers(saved ? JSON.parse(saved) : INITIAL_CUSTOMERS);
    } catch (error) {
      console.error("Could not load customers:", error);
      setCustomers(INITIAL_CUSTOMERS);
    }
    setLoaded(true);
  }, []);

  function persistCustomers(nextCustomers, message) {
    setCustomers(nextCustomers);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustomers));
      setNotice(message);
    } catch (error) {
      console.error("Could not save customers:", error);
      setNotice("Could not save changes. Browser storage may be full.");
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        String(customer.name || "").toLowerCase().includes(query) ||
        String(customer.email || "").toLowerCase().includes(query) ||
        String(customer.phone || "").toLowerCase().includes(query) ||
        String(customer.city || "").toLowerCase().includes(query) ||
        String(customer.id || "").toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All" || customer.status === statusFilter)
      );
    });
  }, [customers, search, statusFilter]);

  const totalSpent = customers.reduce(
    (sum, customer) => sum + Number(customer.spent || 0),
    0
  );

  const repeatCustomers = customers.filter(
    (customer) => Number(customer.orders || 0) > 1
  ).length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function addCustomer(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setNotice("Customer name and email are required.");
      return;
    }

    if (
      customers.some(
        (customer) =>
          String(customer.email).toLowerCase() === email.toLowerCase()
      )
    ) {
      setNotice("A customer with this email already exists.");
      return;
    }

    const customer = {
      id: `CUS-${Date.now().toString().slice(-8)}`,
      name,
      email,
      phone: form.phone.trim(),
      city: form.city.trim(),
      joined: new Date().toISOString().slice(0, 10),
      orders: 0,
      spent: 0,
      status: "Active",
    };

    persistCustomers(
      [customer, ...customers],
      "Customer added successfully."
    );

    setForm({ name: "", email: "", phone: "", city: "" });
    setShowAddForm(false);
  }

  function toggleStatus(customer) {
    const updatedStatus =
      customer.status === "Active" ? "Inactive" : "Active";

    const nextCustomers = customers.map((item) =>
      item.id === customer.id
        ? { ...item, status: updatedStatus }
        : item
    );

    persistCustomers(
      nextCustomers,
      `${customer.name} is now ${updatedStatus.toLowerCase()}.`
    );

    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer({ ...selectedCustomer, status: updatedStatus });
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
            <p>Enter the customer's contact details.</p>
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

            <label>
              City
              <input
                name="city"
                value={form.city}
                onChange={handleFormChange}
                placeholder="City"
              />
            </label>
          </div>

          <button className="customers-primary-button" type="submit">
            Save customer
          </button>
        </form>
      )}

      <section className="customers-stats">
        <article className="customers-stat-card">
          <span>Total customers</span>
          <strong>{customers.length}</strong>
          <small>Profiles in this preview</small>
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
          <small>Across sample customer records</small>
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
                        {String(customer.name || "?")
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
                  <td>{customer.joined || "—"}</td>
                  <td>{Number(customer.orders || 0)}</td>
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
                    No customers match your search or filter.
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
                <span>City</span>
                <strong>{selectedCustomer.city || "Not provided"}</strong>
              </div>
              <div>
                <span>Joined</span>
                <strong>{selectedCustomer.joined || "—"}</strong>
              </div>
              <div>
                <span>Order count</span>
                <strong>{selectedCustomer.orders || 0}</strong>
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

      <p className="customers-storage-note">
        Frontend preview with sample customers. Customer records are stored
        in this browser only. Real customer data will come from the database
        after backend integration.
      </p>
    </main>
  );
}

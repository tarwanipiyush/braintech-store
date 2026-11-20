
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./admin.css";

const stats = [
  {
    label: "Total revenue",
    value: "â‚¹2,48,590",
    change: "+12.8%",
    icon: "â‚¹",
    tone: "purple",
  },
  {
    label: "Total orders",
    value: "1,284",
    change: "+8.2%",
    icon: "â–¤",
    tone: "blue",
  },
  {
    label: "Total products",
    value: "356",
    change: "+4 new",
    icon: "â–¦",
    tone: "orange",
  },
  {
    label: "Low stock items",
    value: "12",
    change: "Needs attention",
    icon: "!",
    tone: "red",
  },
];

const orders = [
  {
    id: "#BT-10842",
    customer: "Rahul Sharma",
    date: "21 Oct 2026",
    amount: "â‚¹74,999",
    status: "Processing",
  },
  {
    id: "#BT-10841",
    customer: "Priya Patel",
    date: "21 Oct 2026",
    amount: "â‚¹18,499",
    status: "Delivered",
  },
  {
    id: "#BT-10840",
    customer: "Aarav Mehta",
    date: "20 Oct 2026",
    amount: "â‚¹1,24,990",
    status: "Pending",
  },
  {
    id: "#BT-10839",
    customer: "Sneha Joshi",
    date: "20 Oct 2026",
    amount: "â‚¹8,999",
    status: "Delivered",
  },
  {
    id: "#BT-10838",
    customer: "Karan Singh",
    date: "19 Oct 2026",
    amount: "â‚¹32,499",
    status: "Cancelled",
  },
];

const products = [
  {
    name: "Gaming PC â€” RTX Series",
    category: "Prebuilt PCs",
    stock: 8,
    price: "â‚¹1,24,999",
    icon: "ðŸ–¥ï¸",
  },
  {
    name: "AMD Ryzen 7 Processor",
    category: "Processors",
    stock: 3,
    price: "â‚¹28,499",
    icon: "âš™ï¸",
  },
  {
    name: "Mechanical Gaming Keyboard",
    category: "Peripherals",
    stock: 16,
    price: "â‚¹6,499",
    icon: "âŒ¨ï¸",
  },
  {
    name: "GeForce RTX Graphics Card",
    category: "Graphics Cards",
    stock: 2,
    price: "â‚¹64,999",
    icon: "ðŸŽ®",
  },
];

const navGroups = [
  {
    heading: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        icon: "â–¦",
        href: "/admin",
      },
      {
        label: "Analytics",
        icon: "â–¥",
        href: "/admin/analytics",
      },
    ],
  },
  {
    heading: "STORE MANAGEMENT",
    items: [
      {
        label: "Products",
        icon: "â–£",
        href: "/admin/products",
      },
      {
        label: "Orders",
        icon: "â–¤",
        href: "/admin/orders",
      },
      {
        label: "Inventory",
        icon: "â–§",
        href: "/admin/inventory",
      },
      {
        label: "Customers",
        icon: "â™™",
        href: "/admin/customers",
      },
      {
        label: "Promotions",
        icon: "ï¼…",
        href: "/admin/promotions",
      },
    ],
  },
  {
    heading: "STORE CUSTOMISATION",
    items: [
      {
        label: "Homepage banners",
        icon: "â–¤",
        href: "/admin/homepage-banner",
      },
      {
        label: "Settings",
        icon: "âš™",
        href: "/admin/settings",
      },
    ],
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
const [dashboardLoading, setDashboardLoading] = useState(true);
const [dashboardError, setDashboardError] = useState("");
const [revenuePeriod, setRevenuePeriod] = useState("12months");

  // Check whether an admin token exists before displaying the dashboard.
  useEffect(() => {
    let cancelled = false;

    function checkAdminAccess() {
      try {
        const token = localStorage.getItem(
          "braintech-admin-token"
        );

        const savedAdmin = localStorage.getItem(
          "braintech-admin"
        );

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        if (savedAdmin) {
          try {
            const admin = JSON.parse(savedAdmin);

            if (!cancelled) {
              setAdminEmail(admin.email || "");
            }
          } catch {
            localStorage.removeItem("braintech-admin");
          }
        }

        if (!cancelled) {
          setAuthenticated(true);
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Admin authentication check error:", error);

        router.replace("/admin/login");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);
  useEffect(() => {
  if (!authenticated) return;

  let cancelled = false;

  async function loadDashboard() {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const token = localStorage.getItem("braintech-admin-token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(
  `/api/admin/dashboard?period=${revenuePeriod}`,
  {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Unable to load dashboard data.");
      }

      if (!cancelled) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Dashboard data loading error:", error);

      if (!cancelled) {
        setDashboardError(
          error.message || "Unable to load dashboard data."
        );
      }
    } finally {
      if (!cancelled) {
        setDashboardLoading(false);
      }
    }
  }

  loadDashboard();

  return () => {
    cancelled = true;
  };
}, [authenticated, router, revenuePeriod]);

  // Logout and clear the saved browser authentication.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const token = localStorage.getItem(
      "braintech-admin-token"
    );

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      localStorage.removeItem("braintech-admin-token");
      localStorage.removeItem("braintech-admin");

      window.location.href = "/admin/login";
    }
  }

  // Do not display dashboard content while checking access.
  if (checkingAuth || !authenticated) {
    return (
      <main className="admin-login-page">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />

        <section className="login-card">
          <div className="login-icon">ðŸ”</div>

          <p className="eyebrow">ADMIN CONSOLE</p>

          <h1>Checking admin access...</h1>

          <p className="login-description">
            Please wait while we check your login.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand sidebar-brand">
          <span className="brand-mark">B</span>

          <span>
            <strong>BRAINTECH</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </Link>

        <div className="sidebar-store">
          <div className="store-avatar">BT</div>

          <div>
            <strong>BrainTech Store</strong>
            <small>Store management</small>
          </div>

          <span className="store-status-dot" />
        </div>

        <nav className="admin-navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.heading}>
              <p className="nav-heading">{group.heading}</p>

              {group.items.map((item) => (
                <Link
                  href={item.href}
                  className={`admin-nav-link ${
                    item.label === "Dashboard"
                      ? "active"
                      : ""
                  }`}
                  key={item.label}
                >
                  {item.icon && (
                    <span className="admin-nav-icon">
                      {item.icon}
                    </span>
                  )}

                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="support-symbol">âœ¦</span>

            <strong>Need assistance?</strong>

            <p>Store management help and support.</p>

            <a href="mailto:support@braintechpc.in">
              Contact support â†—
            </a>
          </div>

          <Link href="/" className="back-to-store">
            <span>â†—</span> View customer store
          </Link>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            <span>Admin</span>
            <span>/</span>
            <strong>Dashboard</strong>
          </div>

          <div className="topbar-actions">
            <span className="system-status">
              <span />
              Store system
            </span>

            <button
              className="notification-button"
              type="button"
              aria-label="Notifications"
              onClick={() =>
                window.alert(
                  "No new notifications in this preview."
                )
              }
            >
              â™§ <i />
            </button>

            <div className="admin-profile">
              <div className="profile-avatar">A</div>

              <div className="profile-copy">
                <strong>Store Admin</strong>

                <small>
                  {adminEmail || "Administrator"}
                </small>
              </div>

              <button
                type="button"
                className="table-action"
                title="Logout"
                aria-label="Logout"
                disabled={loggingOut}
                onClick={handleLogout}
              >
                {loggingOut ? "..." : "â†ª"}
              </button>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">STORE OVERVIEW</p>

              <h1>
                Dashboard <span className="wave">âœ¦</span>
              </h1>

              <p className="dashboard-subtitle">
                Welcome back! Here is what's happening with
                your store.
              </p>
            </div>


<button
  className="admin-primary-button"
  type="button"
  disabled={!dashboardData || dashboardLoading}
  onClick={() => {
    if (!dashboardData) return;

    const rows = [
      ["BRAINTECH STORE - DASHBOARD REPORT"],
      ["Generated on", new Date().toLocaleString("en-IN")],
      [],
      ["DASHBOARD STATISTICS"],
      ["Metric", "Value"],
      ["Total Revenue", dashboardData.stats.total_revenue],
      ["Total Orders", dashboardData.stats.total_orders],
      ["Total Products", dashboardData.stats.total_products],
      ["Low Stock Products", dashboardData.stats.low_stock_products],
      [],
      ["RECENT ORDERS"],
      [
        "Order Number",
        "Customer",
        "Total",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Date",
      ],
      ...(dashboardData.recent_orders || []).map((order) => [
        order.order_number,
        order.customer_name,
        order.total,
        order.payment_method,
        order.payment_status,
        order.order_status,
        order.created_at,
      ]),
      [],
      ["ORDER STATUS SUMMARY"],
      ["Status", "Total"],
      ...(dashboardData.order_status_breakdown || []).map((item) => [
        item.status,
        item.total,
      ]),
      [],
      ["LOW STOCK INVENTORY"],
      ["Product", "Category", "Price", "Stock"],
      ...(dashboardData.inventory_items || []).map((item) => [
        item.name,
        item.category,
        item.price,
        item.stock_quantity,
      ]),
      [],
      ["MONTHLY REVENUE"],
      ["Month", "Revenue"],
      ...(dashboardData.monthly_revenue || []).map((item) => [
        item.month,
        item.revenue,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `braintech-dashboard-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }}
>
  <span>â†“</span> Export report
</button>

          </div>


<div className="demo-banner">
  <span className="demo-banner-icon">âœ“</span>

  <div>
    <strong>Live store data connected</strong>

    <p>
      Dashboard statistics, recent orders, revenue,
      and inventory are now being loaded from your
      BrainTech Store database.
    </p>
  </div>
</div>


         <section className="stats-grid">
  {[
    {
      label: "Total revenue",
      value: dashboardLoading
        ? "Loading..."
        : dashboardError
          ? "Unavailable"
          : `â‚¹${Number(dashboardData?.stats?.total_revenue || 0).toLocaleString("en-IN")}`,
      change: "Confirmed payments only",
      icon: "â‚¹",
      tone: "purple",
    },
    {
      label: "Total orders",
      value: dashboardLoading
        ? "Loading..."
        : dashboardError
          ? "Unavailable"
          : Number(dashboardData?.stats?.total_orders || 0).toLocaleString("en-IN"),
      change: "All order records",
      icon: "â–¤",
      tone: "blue",
    },
    {
      label: "Total products",
      value: dashboardLoading
        ? "Loading..."
        : dashboardError
          ? "Unavailable"
          : Number(dashboardData?.stats?.total_products || 0).toLocaleString("en-IN"),
      change: "Active products",
      icon: "â–¦",
      tone: "orange",
    },
    {
      label: "Low stock items",
      value: dashboardLoading
        ? "Loading..."
        : dashboardError
          ? "Unavailable"
          : Number(dashboardData?.stats?.low_stock_products || 0).toLocaleString("en-IN"),
      change: "Needs attention",
      icon: "!",
      tone: "red",
    },
  ].map((stat) => (
    <article className="stat-card" key={stat.label}>
      <div className={`stat-icon ${stat.tone}`}>
        {stat.icon}
      </div>

      <div className="stat-label">
        {stat.label}
      </div>

      <div className="stat-value">
        {stat.value}
      </div>

      <div className={`stat-change ${stat.tone}`}>
        {stat.change}
      </div>

      <div className="stat-decoration" />
    </article>
  ))}
</section>

          <section className="dashboard-panels">

<article className="admin-panel revenue-panel">
  <div className="panel-heading">
    <div>
      <h2>Revenue overview</h2>
      <p>Your store's confirmed revenue performance</p>
    </div>

   <select
  aria-label="Revenue period"
  value={revenuePeriod}
  onChange={(event) => setRevenuePeriod(event.target.value)}
>
  <option value="7days">7 days</option>
  <option value="30days">30 days</option>
  <option value="12months">12 months</option>
</select>
  </div>

  <div className="revenue-total">
    <strong>
      {dashboardLoading
        ? "Loading..."
        : dashboardError
          ? "Unavailable"
          : `â‚¹${Number(
              dashboardData?.stats?.total_revenue || 0
            ).toLocaleString("en-IN")}`}
    </strong>

    <span>Confirmed payments only</span>
  </div>

  <div className="revenue-chart">
    {dashboardLoading ? (
      <p>Loading revenue data...</p>
    ) : dashboardError ? (
      <p>Unable to load revenue data.</p>
    ) : !dashboardData?.monthly_revenue?.length ? (
      <p>
       No confirmed revenue recorded yet.
{revenuePeriod === "12months"
  ? "Monthly revenue will appear here after successful payments."
  : "Daily revenue will appear here after successful payments."}
      </p>
    ) : (
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
        gap: "12px",
        minHeight: "180px",
        padding: "16px 0"
      }}>
        {dashboardData.monthly_revenue.map((item) => {
          const maximum = Math.max(
            ...dashboardData.monthly_revenue.map(
              (entry) => Number(entry.revenue || 0)
            ),
            1
          );

          const height = Math.max(
            (Number(item.revenue || 0) / maximum) * 140,
            4
          );

          return (
            <div
              key={item.month}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                flex: 1,
                gap: "8px"
              }}
            >
              <strong>
                â‚¹{Number(item.revenue || 0).toLocaleString("en-IN")}
              </strong>

              <div
                style={{
                  width: "70%",
                  height: `${height}px`,
                  background: "#9b7bff",
                  borderRadius: "6px 6px 0 0"
                }}
              />

              <small>{item.month}</small>
            </div>
          );
        })}
      </div>
    )}
  </div>

  <p className="chart-footnote">
    Revenue includes confirmed payments only.
  </p>
</article>


<article className="admin-panel order-summary-panel">
  <div className="panel-heading">
    <div>
      <h2>Order summary</h2>
      <p>Current order status</p>
    </div>

    <span className="panel-menu">Â·Â·Â·</span>
  </div>

  <div className="order-donut-wrap">
    <div className="order-donut">
      <div>
        <strong>
          {dashboardLoading
            ? "..."
            : dashboardError
              ? "â€”"
              : Number(dashboardData?.stats?.total_orders || 0)}
        </strong>

        <small>Total orders</small>
      </div>
    </div>
  </div>

  <div className="order-legend">
    {dashboardLoading ? (
      <div>Loading order statuses...</div>
    ) : dashboardError ? (
      <div>Unable to load order statuses.</div>
    ) : !dashboardData?.order_status_breakdown?.length ? (
      <div>No orders found.</div>
    ) : (
      dashboardData.order_status_breakdown.map((item) => {
        const status = String(item.status || "unknown");
        const statusKey = status.toLowerCase();

        const dotClass =
          statusKey === "delivered"
            ? "purple-dot"
            : statusKey === "placed"
              ? "orange-dot"
              : "blue-dot";

        return (
          <div key={status}>
            <span className={`legend-dot ${dotClass}`} />

            {status.charAt(0).toUpperCase() + status.slice(1)}

            <strong>
              {Number(item.total || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        );
      })
    )}
  </div>
</article>
</section>



<section className="admin-panel table-panel">
  <div className="panel-heading">
    <div>
      <h2>Recent orders</h2>
      <p>Keep track of your latest customer orders</p>
    </div>

    <Link href="/admin/orders" className="text-link">
      View all orders â†’
    </Link>
  </div>

  <div className="admin-table-scroll">
    <table className="admin-table">
      <thead>
        <tr>
          <th>ORDER ID</th>
          <th>CUSTOMER</th>
          <th>DATE</th>
          <th>AMOUNT</th>
          <th>STATUS</th>
          <th>ACTION</th>
        </tr>
      </thead>

      <tbody>
        {dashboardLoading ? (
          <tr>
            <td colSpan="6">Loading recent orders...</td>
          </tr>
        ) : dashboardError ? (
          <tr>
            <td colSpan="6">{dashboardError}</td>
          </tr>
        ) : !dashboardData?.recent_orders?.length ? (
          <tr>
            <td colSpan="6">No orders found.</td>
          </tr>
        ) : (
          dashboardData.recent_orders.map((order) => {
            const status = String(order.order_status || "placed");
            const statusClass =
              status.toLowerCase() === "placed"
                ? "pending"
                : status.toLowerCase();

            const formattedDate = order.created_at
              ? new Date(
                  order.created_at.replace(" ", "T")
                ).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "â€”";

            return (
              <tr key={order.id}>
                <td className="order-id">
                  #{order.order_number}
                </td>

                <td>{order.customer_name || "Guest"}</td>

                <td className="muted-cell">
                  {formattedDate}
                </td>

                <td className="amount-cell">
                  â‚¹{Number(order.total || 0).toLocaleString("en-IN")}
                </td>

                <td>
                  <span className={`order-status ${statusClass}`}>
                    <i />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="table-action"
                    aria-label={`View order ${order.order_number}`}
                    onClick={() => router.push("/admin/orders")}
                  >
                    â†—
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</section>



<section className="admin-panel inventory-panel">
  <div className="panel-heading">
    <div>
      <h2>Inventory snapshot</h2>
      <p>Product stock that may need your attention</p>
    </div>

    <Link
      href="/admin/inventory"
      className="text-link"
    >
      Manage inventory â†’
    </Link>
  </div>

  <div className="inventory-list">
    {dashboardLoading ? (
      <p className="admin-empty-state">
        Loading inventory...
      </p>
    ) : dashboardError ? (
      <p className="admin-empty-state">
        Unable to load inventory data.
      </p>
    ) : !dashboardData?.inventory_items?.length ? (
      <p className="admin-empty-state">
        No low-stock products. Your inventory looks good!
      </p>
    ) : (
      dashboardData.inventory_items.map((product) => (
        <div
          className="inventory-row"
          key={product.id}
        >
          <div className="inventory-product-icon">
            ðŸ“¦
          </div>

          <div className="inventory-product-copy">
            <strong>{product.name}</strong>
            <small>{product.category}</small>
          </div>

          <div className="inventory-price">
            â‚¹{Number(product.price).toLocaleString("en-IN")}
          </div>

          <div
            className={`stock-count ${
              product.stock_quantity <= 3
                ? "stock-low"
                : ""
            }`}
          >
            <span />
            {product.stock_quantity} in stock
          </div>

          <Link
            href="/admin/inventory"
            className="table-action"
            aria-label={`Manage ${product.name}`}
          >
            â†’
          </Link>
        </div>
      ))
    )}
  </div>
</section>



<footer className="admin-footer">
  <span>Â© 2026 BrainTech Store Admin</span>

  <span>
    Live database connected Â· Admin panel
  </span>
</footer>

        </div>
      </section>
    </main>
  );
}

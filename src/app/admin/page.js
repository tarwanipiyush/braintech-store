
"use client";

import Link from "next/link";
import "./admin.css";

const stats = [
  { label: "Total revenue", value: "₹2,48,590", change: "+12.8%", icon: "₹", tone: "purple" },
  { label: "Total orders", value: "1,284", change: "+8.2%", icon: "▤", tone: "blue" },
  { label: "Total products", value: "356", change: "+4 new", icon: "▦", tone: "orange" },
  { label: "Low stock items", value: "12", change: "Needs attention", icon: "!", tone: "red" },
];

const orders = [
  { id: "#BT-10842", customer: "Rahul Sharma", date: "21 Oct 2026", amount: "₹74,999", status: "Processing" },
  { id: "#BT-10841", customer: "Priya Patel", date: "21 Oct 2026", amount: "₹18,499", status: "Delivered" },
  { id: "#BT-10840", customer: "Aarav Mehta", date: "20 Oct 2026", amount: "₹1,24,990", status: "Pending" },
  { id: "#BT-10839", customer: "Sneha Joshi", date: "20 Oct 2026", amount: "₹8,999", status: "Delivered" },
  { id: "#BT-10838", customer: "Karan Singh", date: "19 Oct 2026", amount: "₹32,499", status: "Cancelled" },
];

const products = [
  { name: "Gaming PC — RTX Series", category: "Prebuilt PCs", stock: 8, price: "₹1,24,999", icon: "🖥️" },
  { name: "AMD Ryzen 7 Processor", category: "Processors", stock: 3, price: "₹28,499", icon: "⚙️" },
  { name: "Mechanical Gaming Keyboard", category: "Peripherals", stock: 16, price: "₹6,499", icon: "⌨️" },
  { name: "GeForce RTX Graphics Card", category: "Graphics Cards", stock: 2, price: "₹64,999", icon: "🎮" },
];

const navGroups = [
  {
    heading: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: "▦", href: "/admin" },
      { label: "Analytics", icon: "▥", href: "/admin/analytics" },
    ],
  },
  {
    heading: "STORE MANAGEMENT",
    items: [
      { label: "Products", icon: "▣", href: "/admin/products" },
      { label: "Orders", icon: "▤", href: "/admin/orders" },
      { label: "Inventory", icon: "▧", href: "/admin/inventory" },
      { label: "Customers", icon: "♙", href: "/admin/customers" },
      { label: "Promotions", icon: "％", href: "/admin/promotions" },
    ],
  },
  {
    heading: "STORE CUSTOMISATION",
    items: [
      { label: "Homepage banners", icon: "▤", href: "/admin/homepage-banner" },
      { label: "Settings", icon: "⚙", href: "/admin/settings" },
    ],
  },
];

export default function AdminDashboard() {
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
      item.label === "Dashboard" ? "active" : ""
    }`}
    key={item.label}
  >
    {item.icon && <span className="admin-nav-icon">{item.icon}</span>}
    <span>{item.label}</span>
  </Link>
))}

              
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="support-symbol">✦</span>
            <strong>Need assistance?</strong>
            <p>Store management help and support.</p>
            <a href="mailto:support@braintechpc.in">Contact support ↗</a>
          </div>

          <Link href="/" className="back-to-store">
            <span>↗</span> View customer store
          </Link>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            <span>Admin</span><span>/</span><strong>Dashboard</strong>
          </div>

          <div className="topbar-actions">
            <span className="system-status">
              <span /> Store system
            </span>
            <button
              className="notification-button"
              type="button"
              aria-label="Notifications"
              onClick={() => window.alert("No new notifications in this preview.")}
            >
              ♧ <i />
            </button>
            <div className="admin-profile">
              <div className="profile-avatar">A</div>
              <div className="profile-copy">
                <strong>Store Admin</strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">STORE OVERVIEW</p>
              <h1>Dashboard <span className="wave">✦</span></h1>
              <p className="dashboard-subtitle">
                Welcome back! Here is what's happening with your store.
              </p>
            </div>
            <button
              className="admin-primary-button"
              type="button"
              onClick={() => window.alert("Reports will be connected to real store data later.")}
            >
              <span>↓</span> Export report
            </button>
          </div>

          <div className="demo-banner">
            <span className="demo-banner-icon">ⓘ</span>
            <div>
              <strong>Preview data</strong>
              <p>
                These numbers and orders are sample data for the interface.
                Your real store data will be connected later.
              </p>
            </div>
          </div>

          <section className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className={`stat-icon ${stat.tone}`}>{stat.icon}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className={`stat-change ${stat.tone}`}>{stat.change}</div>
                <div className="stat-decoration" />
              </article>
            ))}
          </section>

          <section className="dashboard-panels">
            <article className="admin-panel revenue-panel">
              <div className="panel-heading">
                <div>
                  <h2>Revenue overview</h2>
                  <p>Your store's revenue performance</p>
                </div>
                <select aria-label="Revenue period" defaultValue="7 days">
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>12 months</option>
                </select>
              </div>

              <div className="revenue-total">
                <strong>₹2,48,590</strong>
                <span>↑ 12.8%</span>
              </div>

              <div className="revenue-chart" aria-label="Illustrative revenue chart">
                <div className="chart-y-labels">
                  <span>₹3L</span><span>₹2L</span><span>₹1L</span><span>₹0</span>
                </div>
                <div className="chart-plot">
                  <div className="chart-grid-line line-one" />
                  <div className="chart-grid-line line-two" />
                  <div className="chart-grid-line line-three" />
                  <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Illustrative upward revenue trend">
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".3" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 142 C35 132 45 148 80 116 S130 130 165 94 S220 111 260 78 S320 102 355 57 S405 86 440 46 S500 72 530 29 S575 45 600 14 L600 180 L0 180 Z" fill="url(#revenueFill)" />
                    <path d="M0 142 C35 132 45 148 80 116 S130 130 165 94 S220 111 260 78 S320 102 355 57 S405 86 440 46 S500 72 530 29 S575 45 600 14" fill="none" stroke="#9b7bff" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="chart-x-labels">
                    <span>15 Oct</span><span>16 Oct</span><span>17 Oct</span><span>18 Oct</span><span>19 Oct</span><span>20 Oct</span><span>21 Oct</span>
                  </div>
                </div>
              </div>
              <p className="chart-footnote">Illustrative chart · Sample data only</p>
            </article>

            <article className="admin-panel order-summary-panel">
              <div className="panel-heading">
                <div>
                  <h2>Order summary</h2>
                  <p>Current order status</p>
                </div>
                <span className="panel-menu">···</span>
              </div>

              <div className="order-donut-wrap">
                <div className="order-donut">
                  <div>
                    <strong>128</strong>
                    <small>Total orders</small>
                  </div>
                </div>
              </div>

              <div className="order-legend">
                <div><span className="legend-dot purple-dot" />Delivered <strong>76</strong></div>
                <div><span className="legend-dot blue-dot" />Processing <strong>32</strong></div>
                <div><span className="legend-dot orange-dot" />Pending <strong>20</strong></div>
              </div>
            </article>
          </section>

          <section className="admin-panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent orders</h2>
                <p>Keep track of your latest customer orders</p>
              </div>
              <Link href="/admin/orders" className="text-link">View all orders →</Link>
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
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td className="muted-cell">{order.date}</td>
                      <td className="amount-cell">{order.amount}</td>
                      <td>
                        <span className={`order-status ${order.status.toLowerCase()}`}>
                          <i />{order.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-action"
                          aria-label={`View ${order.id}`}
                          onClick={() => window.alert(`${order.id} is sample data. Order details will be added later.`)}
                        >
                          ↗
                        </button>
                      </td>
                    </tr>
                  ))}
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
              <Link href="/admin/inventory" className="text-link">Manage inventory →</Link>
            </div>

            <div className="inventory-list">
              {products.map((product) => (
                <div className="inventory-row" key={product.name}>
                  <div className="inventory-product-icon">{product.icon}</div>
                  <div className="inventory-product-copy">
                    <strong>{product.name}</strong>
                    <small>{product.category}</small>
                  </div>
                  <div className="inventory-price">{product.price}</div>
                  <div className={`stock-count ${product.stock <= 3 ? "stock-low" : ""}`}>
                    <span />{product.stock} in stock
                  </div>
                  <button
                    type="button"
                    className="table-action"
                    aria-label={`Manage ${product.name}`}
                    onClick={() => window.alert("Product management will be connected in the next stage.")}
                  >
                    →
                  </button>
                </div>
              ))}
            </div>
          </section>

          <footer className="admin-footer">
            <span>© 2026 BrainTech Store Admin</span>
            <span>Admin console UI preview · Not connected to live store data</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

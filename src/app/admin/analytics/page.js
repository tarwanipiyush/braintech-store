
"use client";

import { useMemo, useState } from "react";
import "./../admin.css";

const reports = {
  "7": {
    label: "Last 7 days",
    sales: [12500, 18200, 15400, 23100, 19800, 28700, 32400],
    orders: [12, 18, 15, 23, 20, 28, 32],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  "30": {
    label: "Last 30 days",
    sales: [32000, 41000, 28500, 52000, 46000, 61000, 55000],
    orders: [31, 40, 28, 51, 46, 60, 54],
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
  },
  "365": {
    label: "This year",
    sales: [180000, 215000, 198000, 265000, 248000, 310000, 345000, 290000, 365000, 390000, 420000, 465000],
    orders: [180, 215, 198, 265, 248, 310, 345, 290, 365, 390, 420, 465],
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
};

const demoProducts = [
  { name: "Gaming PC Builds", units: 84, revenue: 1680000 },
  { name: "Graphics Cards", units: 62, revenue: 744000 },
  { name: "Gaming Monitors", units: 57, revenue: 456000 },
  { name: "Processors", units: 49, revenue: 392000 },
  { name: "Gaming Keyboards", units: 43, revenue: 129000 },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function MetricCard({ title, value, detail, icon }) {
  return (
    <article className="analytics-metric">
      <div className="analytics-metric-top">
        <span>{title}</span>
        <span className="analytics-metric-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [chartType, setChartType] = useState("sales");
  const [reportView, setReportView] = useState("overview");

  const report = reports[period];

  const totals = useMemo(() => {
    const sales = report.sales.reduce((sum, value) => sum + value, 0);
    const orders = report.orders.reduce((sum, value) => sum + value, 0);

    return {
      sales,
      orders,
      average: orders ? sales / orders : 0,
    };
  }, [report]);

  const maxValue = Math.max(
    ...report[chartType],
    1
  );

  function exportReport() {
    const rows = [
      ["Period", report.label],
      ["Metric", "Demo value"],
      ["Total sales", totals.sales],
      ["Total orders", totals.orders],
      ["Average order value", Math.round(totals.average)],
      [],
      ["Period", "Sales (INR)", "Orders"],
      ...report.labels.map((label, index) => [
        label,
        report.sales[index] ?? 0,
        report.orders[index] ?? 0,
      ]),
      [],
      ["Product", "Units sold", "Revenue (INR)"],
      ...demoProducts.map((product) => [
        product.name,
        product.units,
        product.revenue,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `braintech-analytics-${period}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="analytics-page">
      <div className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">STORE PERFORMANCE</p>
          <h1>Analytics</h1>
          <p className="analytics-subtitle">
            Understand your store performance and sales trends.
          </p>
        </div>

        <div className="analytics-heading-actions">
          <select
            aria-label="Select report period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="analytics-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="365">This year</option>
          </select>

          <button
            type="button"
            className="analytics-button analytics-button-primary"
            onClick={exportReport}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="analytics-demo-notice">
        <strong>Demo data</strong>
        <span>
          These figures are illustrative, not actual store sales. They will
          be replaced with database data after backend integration.
        </span>
      </div>

      <div className="analytics-metrics-grid">
        <MetricCard
          title="Total sales"
          value={money(totals.sales)}
          detail={report.label}
          icon="₹"
        />
        <MetricCard
          title="Orders"
          value={totals.orders.toLocaleString("en-IN")}
          detail="Demo orders"
          icon="▤"
        />
        <MetricCard
          title="Average order value"
          value={money(totals.average)}
          detail="Sales ÷ orders"
          icon="↗"
        />
        <MetricCard
          title="Products tracked"
          value={demoProducts.length}
          detail="Sample product groups"
          icon="▦"
        />
      </div>

      <div className="analytics-section-heading">
        <div>
          <h2>Sales performance</h2>
          <p>Compare sales and order activity across the selected period.</p>
        </div>
        <div className="analytics-tabs">
          <button
            type="button"
            className={chartType === "sales" ? "selected" : ""}
            onClick={() => setChartType("sales")}
          >
            Sales
          </button>
          <button
            type="button"
            className={chartType === "orders" ? "selected" : ""}
            onClick={() => setChartType("orders")}
          >
            Orders
          </button>
        </div>
      </div>

      <section className="analytics-panel">
        <div className="analytics-chart-summary">
          <div>
            <span>{chartType === "sales" ? "Total sales" : "Total orders"}</span>
            <strong>
              {chartType === "sales"
                ? money(totals.sales)
                : totals.orders.toLocaleString("en-IN")}
            </strong>
          </div>
          <span className="analytics-period-label">{report.label}</span>
        </div>

        <div className="analytics-chart">
          {report.labels.map((label, index) => {
            const value = report[chartType][index] ?? 0;
            const height = Math.max((value / maxValue) * 100, 4);

            return (
              <div className="analytics-chart-column" key={`${label}-${index}`}>
                <div className="analytics-chart-bar-area">
                  <span className="analytics-chart-value">
                    {chartType === "sales"
                      ? money(value)
                      : value.toLocaleString("en-IN")}
                  </span>
                  <div
                    className={`analytics-chart-bar ${
                      chartType === "orders" ? "orders-bar" : ""
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${label}: ${
                      chartType === "sales" ? money(value) : value
                    }`}
                  />
                </div>
                <span className="analytics-chart-label">{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="analytics-section-heading analytics-lower-heading">
        <div>
          <h2>Product performance</h2>
          <p>Illustrative sales figures for sample product groups.</p>
        </div>
        <select
          aria-label="Product report view"
          className="analytics-select"
          value={reportView}
          onChange={(event) => setReportView(event.target.value)}
        >
          <option value="overview">All products</option>
          <option value="top">Top 3 products</option>
        </select>
      </div>

      <section className="analytics-panel analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Product group</th>
              <th>Units sold</th>
              <th>Revenue</th>
              <th>Share of listed revenue</th>
            </tr>
          </thead>
          <tbody>
            {(reportView === "top" ? demoProducts.slice(0, 3) : demoProducts).map(
              (product) => {
                const totalRevenue = demoProducts.reduce(
                  (sum, item) => sum + item.revenue,
                  0
                );
                const share = totalRevenue
                  ? (product.revenue / totalRevenue) * 100
                  : 0;

                return (
                  <tr key={product.name}>
                    <td className="analytics-product-name">{product.name}</td>
                    <td>{product.units.toLocaleString("en-IN")}</td>
                    <td>{money(product.revenue)}</td>
                    <td>
                      <div className="analytics-share-cell">
                        <div className="analytics-share-track">
                          <div
                            className="analytics-share-fill"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span>{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </section>

      <p className="analytics-footer-note">
        This dashboard is currently frontend-only. Actual revenue, orders,
        product sales, and customer metrics will require your Hostinger
        database and order records.
      </p>
    </main>
  );
}

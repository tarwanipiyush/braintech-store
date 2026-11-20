
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./../admin.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

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
  const router = useRouter();

  const [period, setPeriod] = useState("30");
  const [chartType, setChartType] = useState("sales");
  const [reportView, setReportView] = useState("overview");

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("braintech-admin-token");

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(
          `/api/admin/analytics?period=${period}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || data.success !== true) {
          throw new Error(
            data.message || "Unable to load analytics data."
          );
        }

        if (!cancelled) {
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Analytics loading error:", err);

        if (!cancelled) {
          setError(
            err.message || "Unable to load analytics data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [period, router]);

  const summary = analyticsData?.summary || {
    total_sales: 0,
    total_orders: 0,
    average_order_value: 0,
    products_tracked: 0,
  };

  const chart = analyticsData?.chart || [];
  const products = analyticsData?.product_performance || [];

  const totals = useMemo(() => {
    return {
      sales: Number(summary.total_sales) || 0,
      orders: Number(summary.total_orders) || 0,
      average: Number(summary.average_order_value) || 0,
      products: Number(summary.products_tracked) || 0,
    };
  }, [summary]);

  const visibleProducts =
    reportView === "top" ? products.slice(0, 3) : products;

  const totalProductRevenue = products.reduce(
    (sum, product) => sum + Number(product.revenue || 0),
    0
  );

  const maxValue = Math.max(
    ...chart.map((item) =>
      chartType === "sales"
        ? Number(item.sales || 0)
        : Number(item.orders || 0)
    ),
    1
  );

  const hasChartData = chart.some((item) =>
    chartType === "sales"
      ? Number(item.sales || 0) > 0
      : Number(item.orders || 0) > 0
  );

  function exportReport() {
    if (!analyticsData) return;

    const rows = [
      ["BrainTech Store - Analytics Report"],
      ["Reporting period", analyticsData.period_label],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Actual value"],
      ["Total sales (INR)", totals.sales],
      ["Confirmed orders", totals.orders],
      ["Average order value (INR)", Math.round(totals.average)],
      ["Products sold", totals.products],
      [],
      ["Period", "Sales (INR)", "Confirmed orders"],
      ...chart.map((item) => [
        item.label,
        item.sales,
        item.orders,
      ]),
      [],
      ["Product", "Units sold", "Revenue (INR)", "Share of product revenue"],
      ...products.map((product) => {
        const revenue = Number(product.revenue) || 0;
        const share = totalProductRevenue
          ? (revenue / totalProductRevenue) * 100
          : 0;

        return [
          product.name,
          product.units,
          revenue,
          `${share.toFixed(1)}%`,
        ];
      }),
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
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `braintech-analytics-${period}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

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
            disabled={loading || !!error || !analyticsData}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="analytics-demo-notice">
        <strong>Live database data</strong>
        <span>
          Analytics figures are loaded from your BrainTech Store
          database. Only confirmed payments count as sales.
        </span>
      </div>

      {error && (
        <div className="analytics-demo-notice">
          <strong>Unable to load analytics</strong>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setPeriod((current) => current)}
          >
            Retry
          </button>
        </div>
      )}

      <div className="analytics-metrics-grid">
        <MetricCard
          title="Total sales"
          value={loading ? "Loading..." : money(totals.sales)}
          detail={analyticsData?.period_label || "Selected period"}
          icon="₹"
        />

        <MetricCard
          title="Orders"
          value={
            loading
              ? "Loading..."
              : totals.orders.toLocaleString("en-IN")
          }
          detail="Confirmed orders"
          icon="▤"
        />

        <MetricCard
          title="Average order value"
          value={loading ? "Loading..." : money(totals.average)}
          detail="Sales ÷ confirmed orders"
          icon="↗"
        />

        <MetricCard
          title="Products tracked"
          value={loading ? "Loading..." : totals.products}
          detail="Products with confirmed sales"
          icon="▦"
        />
      </div>

      <div className="analytics-section-heading">
        <div>
          <h2>Sales performance</h2>
          <p>
            Compare confirmed sales and order activity across
            the selected period.
          </p>
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
            <span>
              {chartType === "sales"
                ? "Total sales"
                : "Total confirmed orders"}
            </span>

            <strong>
              {loading
                ? "Loading..."
                : chartType === "sales"
                  ? money(totals.sales)
                  : totals.orders.toLocaleString("en-IN")}
            </strong>
          </div>

          <span className="analytics-period-label">
            {analyticsData?.period_label || "Selected period"}
          </span>
        </div>

        <div className="analytics-chart">
          {loading ? (
            <p>Loading performance data...</p>
          ) : error ? (
            <p>Unable to load chart data.</p>
          ) : !hasChartData ? (
            <p>
              No confirmed {chartType === "sales" ? "sales" : "orders"}{" "}
              recorded during this period. Data will appear here
              after successful payments.
            </p>
          ) : (
            chart.map((item, index) => {
              const value =
                chartType === "sales"
                  ? Number(item.sales || 0)
                  : Number(item.orders || 0);

              const height = Math.max(
                (value / maxValue) * 100,
                4
              );

              return (
                <div
                  className="analytics-chart-column"
                  key={`${item.label}-${index}`}
                >
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
                      title={`${item.label}: ${
                        chartType === "sales"
                          ? money(value)
                          : value
                      }`}
                    />
                  </div>

                  <span className="analytics-chart-label">
                    {item.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="analytics-section-heading analytics-lower-heading">
        <div>
          <h2>Product performance</h2>
          <p>
            Actual units sold and revenue from confirmed orders.
          </p>
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
              <th>Product</th>
              <th>Units sold</th>
              <th>Revenue</th>
              <th>Share of product revenue</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">Loading product performance...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4">Unable to load product data.</td>
              </tr>
            ) : visibleProducts.length === 0 ? (
              <tr>
                <td colSpan="4">
                  No confirmed product sales recorded during this period.
                </td>
              </tr>
            ) : (
              visibleProducts.map((product) => {
                const revenue = Number(product.revenue) || 0;

                const share = totalProductRevenue
                  ? (revenue / totalProductRevenue) * 100
                  : 0;

                return (
                  <tr key={product.name}>
                    <td className="analytics-product-name">
                      {product.name}
                    </td>

                    <td>
                      {Number(product.units || 0).toLocaleString("en-IN")}
                    </td>

                    <td>{money(revenue)}</td>

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
              })
            )}
          </tbody>
        </table>
      </section>

      <p className="analytics-footer-note">
        Analytics uses live order and order-item records.
        Pending payments are excluded from sales and product performance.
      </p>
    </main>
  );
}

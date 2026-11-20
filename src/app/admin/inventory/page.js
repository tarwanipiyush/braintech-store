
"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const API_URL = "/api/admin/products";
const TOKEN_KEY = "braintech-admin-token";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function getStock(product) {
  const value = Number(
    product.stock_quantity ?? product.stock ?? product.inventory ?? 0
  );

  return Number.isFinite(value) ? value : 0;
}

function getToken() {
  if (typeof window === "undefined") return "";

  return localStorage.getItem(TOKEN_KEY) || "";
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product.id,
    stock: getStock(product),
    inventory: getStock(product),
    image: product.image_url || product.image || "",
    category:
      product.category_name ||
      product.category ||
      "Uncategorized",
  };
}

function getProductPayload(product, quantity) {
  return {
    id: product.id,
    category_id: product.category_id ?? null,
    name: product.name || "",
    slug: product.slug || "",
    sku: product.sku || "",
    brand: product.brand || "",
    short_description: product.short_description || "",
    description: product.description || "",
    price: Number(product.price) || 0,
    compare_at_price:
      product.compare_at_price === "" ||
      product.compare_at_price == null
        ? null
        : Number(product.compare_at_price),
    cost_price:
      product.cost_price === "" ||
      product.cost_price == null
        ? null
        : Number(product.cost_price),
    stock_quantity: quantity,
    low_stock_threshold:
      Number(product.low_stock_threshold) || 5,
    image_url: product.image_url || product.image || "",
    is_featured: Number(product.is_featured) ? 1 : 0,
    is_special_offer: Number(product.is_special_offer) ? 1 : 0,
    is_active: Number(product.is_active) ? 1 : 0,
  };
}

async function apiRequest(method, body) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Admin login token not found. Please log in again."
    );
  }

  const response = await fetch(API_URL, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      try {
        const data = await apiRequest("GET");

        const list = Array.isArray(data.products)
          ? data.products
          : [];

        if (!cancelled) {
          setProducts(list.map(normalizeProduct));
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error.message || "Could not load inventory."
          );
          setMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !query ||
          String(product.name || "").toLowerCase().includes(query) ||
          String(product.category || "").toLowerCase().includes(query) ||
          String(product.id || "").toLowerCase().includes(query) ||
          String(product.sku || "").toLowerCase().includes(query);

        const stock = getStock(product);

        const matchesFilter =
          stockFilter === "all" ||
          (stockFilter === "in-stock" && stock > 5) ||
          (stockFilter === "low-stock" &&
            stock > 0 &&
            stock <= 5) ||
          (stockFilter === "out-of-stock" && stock <= 0);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => getStock(a) - getStock(b));
  }, [products, search, stockFilter]);

  const totalUnits = products.reduce(
    (total, product) => total + getStock(product),
    0
  );

  const lowStockCount = products.filter(
    (product) => getStock(product) > 0 && getStock(product) <= 5
  ).length;

  const outOfStockCount = products.filter(
    (product) => getStock(product) <= 0
  ).length;

  function startEditing(product) {
    setEditingId(product.id);
    setStockInput(String(getStock(product)));
    setMessage("");
  }

  async function saveStock(product) {
    const quantity = Number(stockInput);

    if (
      stockInput.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setMessage("Enter a valid whole number of 0 or more.");
      setMessageType("error");
      return;
    }

    setSavingId(product.id);
    setMessage("");

    try {
      const payload = getProductPayload(product, quantity);

      const data = await apiRequest("PUT", payload);

      // Only update the UI after the server confirms success.
      setProducts((current) =>
        current.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                stock: quantity,
                inventory: quantity,
                stock_quantity: quantity,
              }
            : item
        )
      );

      setEditingId(null);
      setStockInput("");
      setMessage(
        data.message || "Stock updated successfully in the database."
      );
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.message || "Could not update stock."
      );
      setMessageType("error");
    } finally {
      setSavingId(null);
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setStockInput("");
    setMessage("");
  }

  function exportInventory() {
    const headers = [
      "ID",
      "Product",
      "Category",
      "SKU",
      "Stock",
      "Price",
    ];

    const rows = products.map((product) => [
      product.id ?? "",
      product.name ?? "",
      product.category ?? "",
      product.sku ?? "",
      getStock(product),
      Number(product.price) || 0,
    ]);

    const escapeCsv = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "braintech-inventory.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return (
      <main className="inventory-page">
        <p>Loading inventory from server...</p>
      </main>
    );
  }

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div>
          <p className="inventory-eyebrow">
            BRAINTECH STORE / ADMIN
          </p>

          <h1>Inventory</h1>

          <p className="inventory-subtitle">
            Manage stock levels and monitor product availability.
          </p>
        </div>

        <button
          className="inventory-export-button"
          onClick={exportInventory}
          type="button"
        >
          Export CSV
        </button>
      </header>

      {message && (
        <div
          className="inventory-message"
          role="status"
          style={{
            color:
              messageType === "error"
                ? "#dc2626"
                : undefined,
          }}
        >
          {message}
        </div>
      )}

      <section className="inventory-stats">
        <article className="inventory-stat-card">
          <span>Total products</span>
          <strong>{products.length}</strong>
          <small>Products in your catalogue</small>
        </article>

        <article className="inventory-stat-card">
          <span>Total stock units</span>
          <strong>{totalUnits.toLocaleString("en-IN")}</strong>
          <small>Combined available quantity</small>
        </article>

        <article className="inventory-stat-card inventory-warning-card">
          <span>Low stock</span>
          <strong>{lowStockCount}</strong>
          <small>Products with 1–5 units</small>
        </article>

        <article className="inventory-stat-card inventory-danger-card">
          <span>Out of stock</span>
          <strong>{outOfStockCount}</strong>
          <small>Products needing replenishment</small>
        </article>
      </section>

      <section className="inventory-panel">
        <div className="inventory-toolbar">
          <div>
            <h2>Stock levels</h2>
            <p>Search products and update quantities.</p>
          </div>

          <input
            className="inventory-search"
            type="search"
            placeholder="Search name, category, SKU..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            className="inventory-filter"
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(event.target.value)
            }
            aria-label="Filter stock status"
          >
            <option value="all">All stock</option>
            <option value="in-stock">In stock (&gt; 5)</option>
            <option value="low-stock">Low stock (1–5)</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / ID</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const stock = getStock(product);
                const isEditing =
                  String(editingId) === String(product.id);
                const isSaving =
                  String(savingId) === String(product.id);

                const status =
                  stock <= 0
                    ? "out"
                    : stock <= 5
                    ? "low"
                    : "available";

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="inventory-product">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name || "Product"}
                          />
                        ) : (
                          <div className="inventory-image-placeholder">
                            BT
                          </div>
                        )}

                        <div>
                          <strong>
                            {product.name || "Unnamed product"}
                          </strong>
                          <small>ID: {product.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>{product.sku || product.id || "—"}</td>
                    <td>{product.category || "Uncategorized"}</td>
                    <td>{formatPrice(product.price)}</td>

                    <td>
                      {isEditing ? (
                        <input
                          className="inventory-stock-input"
                          type="number"
                          min="0"
                          step="1"
                          value={stockInput}
                          disabled={isSaving}
                          onChange={(event) =>
                            setStockInput(event.target.value)
                          }
                          aria-label={`Stock quantity for ${product.name}`}
                        />
                      ) : (
                        <strong>{stock}</strong>
                      )}
                    </td>

                    <td>
                      <span
                        className={`inventory-status ${status}`}
                      >
                        {status === "out"
                          ? "Out of stock"
                          : status === "low"
                          ? "Low stock"
                          : "In stock"}
                      </span>
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="inventory-row-actions">
                          <button
                            type="button"
                            className="inventory-save-button"
                            disabled={isSaving}
                            onClick={() => saveStock(product)}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            className="inventory-cancel-button"
                            disabled={isSaving}
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="inventory-edit-button"
                          onClick={() => startEditing(product)}
                        >
                          Edit stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="inventory-empty">
                    No products match your search or stock filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="inventory-footer">
          Showing {filteredProducts.length} of {products.length} products
        </footer>
      </section>

      <p className="inventory-storage-note">
        Inventory is loaded from your server. Stock changes are saved
        to the product database after the server confirms the update.
      </p>
    </main>
  );
}

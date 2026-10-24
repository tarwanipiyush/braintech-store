
"use client";

import { useEffect, useMemo, useState } from "react";
import { products as seedProducts } from "@/data/products";
import "../admin.css";

const STORAGE_KEY = "braintech-admin-products-v1";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function getStock(product) {
  const value = Number(product.stock ?? product.inventory ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const list = saved ? JSON.parse(saved) : seedProducts;

      setProducts(
        Array.isArray(list)
          ? list.map((product) => ({
              ...product,
              stock: getStock(product),
            }))
          : []
      );
    } catch (error) {
      console.error("Could not load inventory:", error);
      setProducts(
        seedProducts.map((product) => ({
          ...product,
          stock: getStock(product),
        }))
      );
    }

    setLoaded(true);
  }, []);

  function saveProducts(nextProducts) {
    setProducts(nextProducts);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts));
      setMessage("Inventory saved successfully.");
    } catch (error) {
      console.error("Could not save inventory:", error);
      setMessage(
        "Could not save changes. Browser storage may be full."
      );
    }
  }

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
          (stockFilter === "low-stock" && stock > 0 && stock <= 5) ||
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

  function saveStock(product) {
    const quantity = Number(stockInput);

    if (
      stockInput.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setMessage("Enter a valid whole number of 0 or more.");
      return;
    }

    const nextProducts = products.map((item) =>
      item.id === product.id
        ? {
            ...item,
            stock: quantity,
            inventory: quantity,
          }
        : item
    );

    saveProducts(nextProducts);
    setEditingId(null);
    setStockInput("");
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
        <p>Loading inventory...</p>
      </main>
    );
  }

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div>
          <p className="inventory-eyebrow">BRAINTECH STORE / ADMIN</p>
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
        <div className="inventory-message" role="status">
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
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="inventory-filter"
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
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
                const isEditing = editingId === product.id;

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
                          <strong>{product.name || "Unnamed product"}</strong>
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
                      <span className={`inventory-status ${status}`}>
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
                            onClick={() => saveStock(product)}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="inventory-cancel-button"
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
        Frontend preview: stock changes are saved in this browser and use
        the same local product storage as the Products admin page. They
        are not yet synced to a server or database.
      </p>
    </main>
  );
}

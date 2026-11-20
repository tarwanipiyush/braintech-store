
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartControl from "./AddToCartControl";

const formatPrice = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");


function normalizeProduct(product) {
  const stock = Number(
    product.stock_quantity ??
    product.stock ??
    product.stockQuantity ??
    0
  );

  const price = Number(product.price ?? 0);
  const compareAt = Number(product.compare_at_price ?? 0);

  const isFeatured =
    product.is_featured === true ||
    product.is_featured === 1 ||
    product.is_featured === "1" ||
    String(product.is_featured).toLowerCase() === "true";

  const isSpecialOffer =
    product.is_special_offer === true ||
    product.is_special_offer === 1 ||
    product.is_special_offer === "1" ||
    String(product.is_special_offer).toLowerCase() === "true";

  return {
    ...product,
    id: product.id,
    name: product.name,
    category: product.category || "Components",
    image: product.image_url || "/images/product-placeholder.png",
    price,
    oldPrice: compareAt,
    stock: Number.isFinite(stock) ? stock : 0,
    stock_quantity: Number.isFinite(stock) ? stock : 0,
    is_featured: isFeatured,
    is_special_offer: isSpecialOffer,
    tag: isSpecialOffer
      ? "Hot pick"
      : isFeatured
        ? "Bestseller"
        : "",
  };
}


export default function FeaturedProducts({
  title = "Featured Products",
  subtitle = "Explore our handpicked PC components and gaming essentials.",
  tags = ["Bestseller", "Hot pick"],
  limit = 4,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch("/api/store/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || "Unable to load products."
          );
        }

        const databaseProducts = Array.isArray(data.products)
          ? data.products.map(normalizeProduct)
          : [];

        if (!cancelled) {
          setProducts(databaseProducts);
        }
      } catch (err) {
        console.error("Featured products loading error:", err);

        if (!cancelled) {
          setError(true);
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

const featuredProducts = products
  .filter((product) => {
    if (tags.includes("Bestseller")) {
      return true;
    }

    if (tags.includes("Hot pick")) {
      return true;
    }

    if (tags.includes("Monitor deal")) {
      return String(product.category || "")
        .toLowerCase()
        .includes("monitor");
    }

    return false;
  })
  .slice(0, limit);

  if (loading) {
    return (
      <section className="featured-products-section">
        <div className="featured-products-heading">
          <div>
            <span className="featured-products-kicker">
              {title === "Best Sellers"
                ? "THE BRAINTECH EDIT"
                : "LIMITED-TIME DEALS"}
            </span>

            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <p>Loading products...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-products-section">
        <div className="featured-products-heading">
          <div>
            <span className="featured-products-kicker">
              {title === "Best Sellers"
                ? "THE BRAINTECH EDIT"
                : "LIMITED-TIME DEALS"}
            </span>

            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <Link href="/shop" className="featured-view-all">
            View all products <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p>Products could not be loaded. Please try again later.</p>
      </section>
    );
  }


  return (
    <section className="featured-products-section">
      <div className="featured-products-heading">
        <div>
          <span className="featured-products-kicker">
            {title === "Best Sellers"
              ? "THE BRAINTECH EDIT"
              : "LIMITED-TIME DEALS"}
          </span>

          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <Link href="/shop" className="featured-view-all">
          View all products <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="featured-products-grid">
        {featuredProducts.map((product) => {
          const stock = Number(product.stock_quantity ?? 0);
          const outOfStock = !Number.isFinite(stock) || stock <= 0;

          return (
            <article
              className="featured-product-card"
              key={product.id}
            >
              <Link
                href={`/products/${product.id}`}
                className="featured-product-image"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                />

                {outOfStock ? (
                  <span className="featured-product-badge featured-out-of-stock">
                    OUT OF STOCK
                  </span>
                ) : product.tag ? (
                  <span className="featured-product-badge">
                    {product.tag}
                  </span>
                ) : null}
              </Link>

              <div className="featured-product-info">
                <span className="featured-product-category">
                  {product.category}
                </span>

                <Link href={`/products/${product.id}`}>
                  <h3>{product.name}</h3>
                </Link>

                <div className="featured-product-price">
                  <strong>{formatPrice(product.price)}</strong>

                  {product.oldPrice > product.price && (
                    <del>{formatPrice(product.oldPrice)}</del>
                  )}
                </div>

                {outOfStock ? (
                  <button
                    type="button"
                    className="featured-stock-unavailable"
                    disabled
                  >
                    OUT OF STOCK
                  </button>
                ) : (
                  <AddToCartControl product={product} />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

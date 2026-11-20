
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categories as localCategories } from "@/data/products";

const CATEGORY_IMAGE_OVERRIDES = {};


function normalizeProduct(product) {
  const categoryId =
    product.category_id === null ||
    product.category_id === undefined ||
    product.category_id === ""
      ? null
      : Number(product.category_id);

  return {
    ...product,
    id: Number(product.id),
    category_id: Number.isFinite(categoryId)
      ? categoryId
      : null,
    image:
      product.image_url ||
      product.image ||
      "/images/product-placeholder.png",
    stock: Number(
      product.stock_quantity ??
      product.stock ??
      0
    ),
  };
}

export default function CategoryTiles({
  active = "",
  onSelect,
}) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/store/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || "Unable to load categories."
          );
        }

        const databaseCategories = Array.isArray(data.categories)
          ? data.categories
          : [];

        const databaseProducts = Array.isArray(data.products)
          ? data.products.map(normalizeProduct)
          : [];

        const nextCards = databaseCategories.map((category) => {
          const categoryProducts = databaseProducts.filter(
            (product) =>
              product.category_id === Number(category.id)
          );

          const overrideId =
            CATEGORY_IMAGE_OVERRIDES[category.name];

          const cover =
            categoryProducts.find(
              (product) => product.id === Number(overrideId)
            ) || categoryProducts[0];

          const localCategory = localCategories.find(
            ([name]) =>
              name.toLowerCase() ===
              String(category.name).toLowerCase()
          );

          return {
            id: Number(category.id),
            name: category.name,
            icon: localCategory?.[1] || "◇",
            count: categoryProducts.length,
            image: cover?.image || "",
          };
        });

        if (!cancelled) {
          setCards(nextCards);
        }
      } catch (error) {
        console.error("Category tiles loading error:", error);

        if (!cancelled) {
          setCards([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="cat-grid">
        <p>Loading categories...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="cat-grid">
        <p>No categories available.</p>
      </div>
    );
  }

  return (
    <div className="cat-grid">
      {cards.map((card) => {
        const isActive = active === card.name;

        const className = `cat-card ${
          isActive ? "is-active" : ""
        }`;

        const content = (
          <>
            {card.image ? (
              <img src={card.image} alt="" loading="lazy" />
            ) : (
              <span className="cat-image-placeholder" />
            )}

            <span className="cat-shade" />

            <span className="cat-icon">
              {card.icon}
            </span>

            <span className="cat-count">
              {card.count} {card.count === 1 ? "item" : "items"}
            </span>

            <span className="cat-body">
              <b>{card.name}</b>

              <small>
                {isActive ? (
                  "Showing now ✓"
                ) : (
                  <>
                    Shop now <i>→</i>
                  </>
                )}
              </small>
            </span>
          </>
        );

        return onSelect ? (
          <button
            key={card.id}
            type="button"
            className={className}
            onClick={() => onSelect(card.name)}
            aria-pressed={isActive}
          >
            {content}
          </button>
        ) : (
          <Link
            key={card.id}
            href={`/shop?category=${encodeURIComponent(
              card.name
            )}`}
            className={className}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

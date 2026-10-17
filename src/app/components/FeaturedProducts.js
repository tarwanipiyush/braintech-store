"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";

const formatPrice = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

export default function FeaturedProducts({
  title = "Featured Products",
  subtitle = "Explore our handpicked PC components and gaming essentials.",
  tags = ["Bestseller", "Hot pick"],
  limit = 4,
}) {
  const { addToCart } = useCart();

  const featuredProducts = products
    .filter((product) => tags.includes(product.tag))
    .slice(0, limit);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="featured-products-section">
      <div className="featured-products-heading">
        <div>
          
<span className="featured-products-kicker">
  {title === "Best Sellers" ? "THE BRAINTECH EDIT" : "LIMITED-TIME DEALS"}
</span>

          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <Link href="/shop" className="featured-view-all">
          View all products <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="featured-products-grid">
        {featuredProducts.map((product) => (
          <article className="featured-product-card" key={product.id}>
            <Link
              href={`/products/${product.id}`}
              className="featured-product-image"
            >
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
              />

              {product.tag && (
                <span className="featured-product-badge">
                  {product.tag}
                </span>
              )}
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

              <button
                type="button"
                className="featured-add-to-cart"
                onClick={() => addToCart(product)}
              >
                + Add to Cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
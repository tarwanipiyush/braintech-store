
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const STORAGE_KEY = "braintech-admin-products-v1";

export default function ProductDetailsPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const products = saved ? JSON.parse(saved) : [];

      const found = Array.isArray(products)
        ? products.find(
            (item) => String(item.id) === String(params.id)
          )
        : null;

      setProduct(found || null);
    } catch (error) {
      console.error("Could not load product:", error);
      setProduct(null);
    } finally {
      setLoaded(true);
    }
  }, [params.id]);

  if (!loaded) {
    return <main style={{ padding: 32 }}>Loading product…</main>;
  }

  if (!product) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Product not found</h1>
        <p>No saved product matches ID: {params.id}</p>
        <Link href="/admin/products">Back to Products</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <Link href="/admin/products">← Back to Products</Link>

      <h1 style={{ marginTop: 24 }}>{product.name}</h1>
      <p>Product ID: {product.id}</p>

      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: 240,
            height: 240,
            objectFit: "contain",
            borderRadius: 12,
          }}
        />
      )}

      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Price:</strong> ₹{Number(product.price).toLocaleString("en-IN")}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      <p><strong>SKU:</strong> {product.sku || "Not assigned"}</p>
      <p><strong>Status:</strong> {product.status}</p>
      <p>{product.description}</p>

      <p style={{ marginTop: 24 }}>
        To edit this product, return to Products and select Edit beside it.
      </p>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AddToCartControl from "../../components/AddToCartControl";
import HomepageBanners from "../../components/HomepageBanners";

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN");

function categorySlug(category) {
  return String(category || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeProduct(item) {
  return {
    ...item,
    id: Number(item.id),
    name: item.name || "Unnamed Product",
    category: item.category || "Other",
    image: item.image_url || "",
    price: Number(item.price || 0),
    oldPrice: Number(item.compare_at_price || 0),
    stockQuantity: Number(item.stock_quantity || 0),
    description:
      item.short_description ||
      item.description ||
      "",
    specifications: Array.isArray(item.specifications)
      ? item.specifications
      : [],
  };
}

export default function ProductPage() {
  const params = useParams();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/store/products", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load products."
          );
        }

        const databaseProducts = Array.isArray(data.products)
          ? data.products.map(normalizeProduct)
          : [];

        if (cancelled) return;

        setAllProducts(databaseProducts);

        const selectedProduct = databaseProducts.find(
          (item) => item.id === Number(id)
        );

        setProduct(selectedProduct || null);
      } catch (err) {
        if (!cancelled) {
          console.error("Product detail loading error:", err);
          setError(
            err.message || "Unable to load this product."
          );
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
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7fa] p-8 text-[#222532]">
        <div className="mx-auto max-w-6xl">
          <p className="animate-pulse text-gray-500">
            Loading product details...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f7fa] p-8 text-[#222532] md:p-16">
        <Link href="/" className="font-bold text-rose-600">
          ← Back to BrainTech Store
        </Link>

        <h1 className="mt-8 text-3xl font-black">
          Unable to load product
        </h1>

        <p className="mt-3 text-gray-600">{error}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-rose-600 px-5 py-3 font-bold text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f7f7fa] p-8 text-[#222532] md:p-16">
        <Link href="/" className="font-bold text-rose-600">
          ← Back to BrainTech Store
        </Link>

        <h1 className="mt-8 text-3xl font-black">
          Product not found
        </h1>

        <p className="mt-3 text-gray-600">
          This product may have been removed or is no longer available.
        </p>

        <Link
          href="/shop"
          className="mt-6 inline-block rounded-lg bg-rose-600 px-5 py-3 font-bold text-white"
        >
          Browse products
        </Link>
      </main>
    );
  }

  const related = allProducts
    .filter(
      (item) =>
        item.category === product.category &&
        item.id !== product.id
    )
    .slice(0, 4);

  const discount =
    product.oldPrice > product.price && product.oldPrice > 0
      ? Math.round(
          (1 - product.price / product.oldPrice) * 100
        )
      : 0;

 return (
    <main className="min-h-screen bg-[#f7f7fa] text-[#222532]">
      <HomepageBanners page="product" placement="top" />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-rose-600">
            Home
          </Link>

          <span>/</span>

          <Link
            href={`/category/${categorySlug(product.category)}`}
            className="hover:text-rose-600"
          >
            {product.category}
          </Link>

          <span>/</span>

          <span className="text-gray-800">
            {product.name}
          </span>
        </div>

        <section className="grid gap-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2 md:gap-12 md:p-10">
          <div className="flex min-h-72 items-center justify-center rounded-xl bg-[#f8f8fb] p-5 md:min-h-[420px]">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="max-h-[390px] w-full object-contain"
              />
            ) : (
              <div className="text-sm text-gray-400">
                Product image unavailable
              </div>
            )}
          </div>

          <div className="flex flex-col items-start py-1">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600">
              {product.category}
            </span>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              {product.name}
            </h1>

            {product.brand && (
              <p className="mt-2 text-sm text-gray-500">
                Brand: {product.brand}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-black">
                {money(product.price)}
              </span>

              {product.oldPrice > product.price && (
                <>
                  <del className="text-gray-400">
                    {money(product.oldPrice)}
                  </del>

                  {discount > 0 && (
                    <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      {discount}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            <p
              className={`mt-4 text-sm font-semibold ${
                product.stockQuantity > 0
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {product.stockQuantity > 0
                ? `In stock (${product.stockQuantity} available)`
                : "Out of stock"}
            </p>

            {product.description && (
              <p className="mt-5 leading-7 text-gray-600">
                {product.description}
              </p>
            )}

            <div className="mt-5">
              <AddToCartControl product={product} size="lg" />
            </div>

            {product.sku && (
              <p className="mt-4 text-xs text-gray-400">
                SKU: {product.sku}
              </p>
            )}

            <Link
              href="/shop"
              className="mt-5 text-sm font-bold text-rose-600 hover:underline"
            >
              ← Continue shopping
            </Link>
          </div>
               </section>

        <HomepageBanners page="product" placement="below_hero" />

        {product.specifications.length > 0 && (
          <section className="mt-12 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
            <h2 className="text-2xl font-black">
              Technical Specifications
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Detailed product specifications.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full border-collapse text-left text-sm">
                <tbody>
                  {product.specifications.map((spec) => (
                    <tr
                      key={spec.field_id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <th className="w-1/2 bg-gray-50 px-4 py-4 font-semibold text-gray-700 md:w-2/5">
                        {spec.field_label}
                      </th>

                      <td className="px-4 py-4 text-gray-600">
                        {spec.value}
                        {spec.unit_label
                          ? ` ${spec.unit_label}`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

               <HomepageBanners page="product" placement="between_sections" />

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-black">
              More in {product.category}
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="rounded-xl border border-gray-100 bg-white p-3 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-32 items-center justify-center rounded-lg bg-[#f8f8fb] p-2">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
                        No image
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm font-bold">
                    {item.name}
                  </p>

                  <p className="mt-2 font-black">
                    {money(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
             <HomepageBanners page="product" placement="before_footer" />

      </div>
    </main>
  );
}

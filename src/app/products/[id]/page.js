"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";

const money = (value) => "₹" + value.toLocaleString("en-IN");

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const product = products.find((item) => item.id === Number(id));

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f7f7fa] p-8 text-[#222532] md:p-16">
        <Link href="/" className="font-bold text-rose-600">← Back to BrainTech Store</Link>
        <h1 className="mt-8 text-3xl font-black">Product not found</h1>
        <p className="mt-3 text-gray-600">This item may have been removed from the sample catalog.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-rose-600 px-5 py-3 font-bold text-white">Browse all products</Link>
      </main>
    );
  }

  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#f7f7fa] text-[#222532]">
      
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-rose-600">Home</Link><span>/</span>
          <Link href={`/category/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`} className="hover:text-rose-600">{product.category}</Link><span>/</span>
          <span className="text-gray-800">{product.name}</span>
        </div>
        <section className="grid gap-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2 md:gap-12 md:p-10">
          <div className="flex min-h-72 items-center justify-center rounded-xl bg-[#f8f8fb] p-5 md:min-h-[420px]">
            <img src={product.image} alt={product.name} className="max-h-[390px] w-full object-contain" />
          </div>
          <div className="flex flex-col items-start py-1">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600">{product.category}</span>
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-center gap-2 text-sm"><span className="text-amber-500">★★★★★</span><span className="text-gray-500">{product.rating} · Demo rating</span></div>
            <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-3xl font-black">{money(product.price)}</span><del className="text-gray-400">{money(product.oldPrice)}</del><span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{Math.round((1-product.price/product.oldPrice)*100)}% off (demo)</span></div>
            <p className="mt-5 leading-7 text-gray-600">{product.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">{product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <button onClick={() => { addToCart(product); setAdded(true); }} className="mt-8 w-full rounded-lg bg-rose-600 px-6 py-4 font-extrabold text-white transition hover:bg-rose-700">＋ ADD TO CART</button>
            {added && <p role="status" className="mt-3 text-sm font-bold text-emerald-700">Added to cart successfully. <Link href="/cart" className="underline">View cart</Link></p>}
            <p className="mt-4 text-xs leading-5 text-gray-400">Demo storefront only. Product details, pricing, availability and specifications are illustrative and must be confirmed against the official inventory before purchase.</p>
            <Link href="/" className="mt-5 text-sm font-bold text-rose-600 hover:underline">← Continue shopping</Link>
          </div>
        </section>
        {related.length > 0 && <section className="mt-12"><h2 className="text-2xl font-black">More in {product.category}</h2><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((item) => <Link key={item.id} href={`/products/${item.id}`} className="rounded-xl border border-gray-100 bg-white p-3 transition hover:-translate-y-1 hover:shadow-md"><div className="flex h-32 items-center justify-center rounded-lg bg-[#f8f8fb] p-2"><img src={item.image} alt={item.name} className="max-h-full w-full object-contain" /></div><p className="mt-3 text-sm font-bold">{item.name}</p><p className="mt-2 font-black">{money(item.price)}</p></Link>)}</div></section>}
      </div>
    </main>
  );
}

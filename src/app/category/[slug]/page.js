"use client";

import AddToCartControl from "../../components/AddToCartControl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { categories, products } from "@/data/products";

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = (value) => "₹" + value.toLocaleString("en-IN");

export default function CategoryPage() {
  const { slug } = useParams();
  const { addToCart, cartCount } = useCart();
  const category = categories.find(([name]) => slugify(name) === slug)?.[0] || (slug === "gaming-gears" ? "Gaming Gears" : null);
  const categoryProducts = products.filter((product) => category === "Gaming Gears"
    ? ["Mouse", "Keyboards", "Headphones", "Mousepad"].includes(product.category)
    : product.category === category);

  return (
    <main className="min-h-screen bg-[#f7f7fa] text-[#222532]">
     
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6 text-sm text-gray-500"><Link href="/" className="hover:text-rose-600">Home</Link> / {category || "Category"}</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-rose-600">Shop by category</p><h1 className="mt-2 text-3xl font-black md:text-4xl">{category || "Category not found"}</h1><p className="mt-2 text-sm text-gray-500">{categoryProducts.length} sample products in this category</p></div>
          <Link href="/#categories" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-bold hover:border-rose-400">Browse categories ↗</Link>
        </div>
        <nav className="mt-7 flex gap-2 overflow-x-auto pb-2">{categories.map(([name]) => <Link key={name} href={`/category/${slugify(name)}`} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${name === category ? "border-rose-600 bg-rose-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-rose-400"}`}>{name}</Link>)}</nav>
        {categoryProducts.length === 0 ? <div className="mt-8 rounded-2xl bg-white p-10 text-center"><h2 className="text-xl font-bold">Category unavailable</h2><p className="mt-2 text-gray-500">Choose another category to browse sample products.</p></div> : <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{categoryProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-lg"><Link href={`/products/${product.id}`} className="relative flex h-40 items-center justify-center bg-[#f8f8fb] p-4 md:h-52"><img src={product.image} alt={product.name} className="max-h-full w-full object-contain"/><span className="absolute left-3 top-3 rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-rose-600">{product.tag}</span></Link><div className="p-3 md:p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{product.category}</p><Link href={`/products/${product.id}`} className="mt-2 block min-h-10 text-sm font-bold leading-5 hover:text-rose-600">{product.name}</Link><div className="mt-3 flex flex-wrap items-center gap-2"><b className="text-base">{money(product.price)}</b><del className="text-xs text-gray-400">{money(product.oldPrice)}</del></div>  <div className="mt-4"><AddToCartControl product={product} tone="light" /></div></div></article>)}</div>}
        <p className="mt-8 text-xs leading-5 text-gray-400">Demo catalog only. Product names, images, prices, stock and specifications are illustrative and are not synced to BrainTech PC’s live inventory.</p>
      </div>
    </main>
  );
}

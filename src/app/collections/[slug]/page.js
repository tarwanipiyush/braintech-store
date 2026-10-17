
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/data/products";

const collections = {
  amd: {
    name: "AMD",
    matches: ["amd", "ryzen", "radeon"],
  },
  intel: {
    name: "Intel",
    matches: ["intel"],
  },
  logitech: {
    name: "Logitech",
    matches: ["logitech"],
  },
  razer: {
    name: "Razer",
    matches: ["razer"],
  },
  hyperx: {
    name: "HyperX",
    matches: ["hyperx"],
  },
  "cooler-master": {
    name: "Cooler Master",
    matches: ["cooler master"],
  },
  corsair: {
    name: "Corsair",
    matches: ["corsair"],
  },
  gigabyte: {
    name: "Gigabyte",
    matches: ["gigabyte"],
  },
  "lian-li": {
    name: "Lian Li",
    matches: ["lian li"],
  },
};

function formatPrice(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const collection = collections[slug];

  if (!collection) notFound();

  const items = products.filter((product) => {
    const name = product.name.toLowerCase();

    return collection.matches.some((term) => name.includes(term));
  });

  return (
    <main className="internal-page">
      <div className="internal-page-inner">
        <nav className="internal-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{collection.name}</span>
        </nav>

        <span className="internal-kicker">BRAIN TECH COLLECTION</span>

        <h1>{collection.name} Products</h1>

        <p className="internal-intro">
          Browse products matching {collection.name} in our current catalogue.
        </p>

        {items.length > 0 ? (
          <>
            <p className="internal-intro">
              {items.length} matching{" "}
              {items.length === 1 ? "product" : "products"}
            </p>

            <div className="internal-product-grid">
              {items.map((product) => (
                <Link
                  href={`/products/${product.id}`}
                  className="internal-product-card"
                  key={product.id}
                >
                  <div className="internal-product-image">
                    <img src={product.image} alt={product.name} />
                  </div>

                  <h2>{product.name}</h2>
                  <p>{formatPrice(product.price)}</p>
                  <span>View product →</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <section className="internal-empty-state">
            <div className="internal-empty-icon">⌕</div>
            <h2>No matching products yet</h2>
            <p>
              We couldn't find any {collection.name} products in the current
              catalogue. Check back when the catalogue is updated.
            </p>
            <Link className="internal-shop-button" href="/">
              Browse All Products
            </Link>
          </section>
        )}

        <Link className="internal-secondary-button" href="/">
          ← Back to Store
        </Link>
      </div>
    </main>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { products, categories } from "@/data/products";

const formatPrice = (amount) => "₹" + amount.toLocaleString("en-IN");

// Wishlist lives in localStorage so the header (and a page refresh) can see it.
function subscribeWishlist(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("braintech-wishlist", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("braintech-wishlist", callback);
  };
}

function readWishlistRaw() {
  try {
    return localStorage.getItem("braintech-wishlist") || "[]";
  } catch {
    return "[]";
  }
}

function parseWishlist(raw) {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
const COMPONENT_CATEGORIES = [
  "Processors",
  "Motherboards",
  "Graphic Cards",
  "PC Cabinet",
  "Power Supply",
  "CPU Cooler",
  "RAM",
  "SSD",
];

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopFromUrl />
    </Suspense>
  );
}

// Reads filters from the URL (?category=, ?q=, ?special=, ?wishlist=) and
// remounts the shop whenever they change, so links from the home page work.
function ShopFromUrl() {
  const searchParams = useSearchParams();
  const initial = {
    category: searchParams.get("category") || "",
    q: searchParams.get("q") || "",
    special: searchParams.get("special") === "1",
    wishlist: searchParams.get("wishlist") === "1",
  };

  return <ShopContent key={searchParams.toString()} initial={initial} />;
}

function ShopContent({ initial }) {
  const router = useRouter();
  const toastTimer = useRef(null);
  const hasInitialFilter =
    !!initial.category || !!initial.q || initial.special || initial.wishlist;
  const { cart, cartCount, addToCart, updateQuantity } = useCart();

  const [search, setSearch] = useState(initial.q);
 const [activeCategory, setActiveCategory] = useState(
    initial.category || (hasInitialFilter ? "All Products" : "")
  );
  const [sort, setSort] = useState("featured");
  const wishlistRaw = useSyncExternalStore(subscribeWishlist, readWishlistRaw, () => "[]");
  const wishlist = useMemo(() => parseWishlist(wishlistRaw), [wishlistRaw]);
  const [wishlistOnly, setWishlistOnly] = useState(initial.wishlist);
  const [specialOnly, setSpecialOnly] = useState(initial.special);
const [productTab, setProductTab] = useState("");
  const [quickView, setQuickView] = useState(null);
  const [toast, setToast] = useState(null);

  // Jump to the product list when arriving with a filter from the home page
  useEffect(() => {
    if (!hasInitialFilter) return;
    const t = window.setTimeout(() => {
      document
        .getElementById("catalog")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [hasInitialFilter]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
     
const matchesCategory =
  !activeCategory ||
  activeCategory === "All Products" ||
  p.category === activeCategory ||
  (activeCategory === "Gaming Gears" &&
    ["Mouse", "Keyboards", "Headphones", "Mousepad"].includes(
      p.category
    )) ||
  (activeCategory === "Components" &&
    COMPONENT_CATEGORIES.includes(p.category));


      
const searchTerm = search.trim().toLowerCase();

const matchesSearch =
  `${p.name || ""} ${p.category || ""} ${p.tag || ""}`
    .toLowerCase()
    .includes(searchTerm);


      const matchesWishlist =
        !wishlistOnly || wishlist.includes(p.id);

      
const matchesSpecial =
  !specialOnly ||
  ["Monitor deal", "Hot pick", "Deal", "Bestseller"].includes(
    p.tag
  );


const matchesProductTab =
  productTab === "" ||
  (productTab === "Best Sellers" &&
    ["Bestseller", "Hot pick"].includes(p.tag)) ||
  (productTab === "New Arrivals" &&
    p.id >= 179);



      
return (
  matchesCategory &&
  matchesSearch &&
  matchesWishlist &&
  matchesSpecial &&
  matchesProductTab
);

    });


    
if (productTab === "New Arrivals") {
  result = [...result].sort((a, b) => b.id - a.id);
}


   
if (sort === "price-low") {
  result = [...result].sort((a, b) => a.price - b.price);
}

if (sort === "price-high") {
  result = [...result].sort((a, b) => b.price - a.price);
}

if (sort === "name") {
  result = [...result].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );
}

if (sort === "rating") {
  result = [...result].sort(
    (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
  );
}


    return result;
  }, [
    search,
    activeCategory,
    sort,
    wishlistOnly,
    wishlist,
    specialOnly,
    productTab,
  ]);

  function chooseCategory(category) {
    setActiveCategory(category);
    setSearch("");
    setWishlistOnly(false);
    setSpecialOnly(false);

    document
      .getElementById("catalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addProduct(product) {
    addToCart(product);

    setToast({
      ...product,
      message: `${product.name} added to your cart`,
    });

    window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3600);
  }

    function toggleWishlist(id) {
    const next = wishlist.includes(id)
      ? wishlist.filter((item) => item !== id)
      : [...wishlist, id];

    try {
      localStorage.setItem("braintech-wishlist", JSON.stringify(next));
    } catch {
      /* storage unavailable — ignore */
    }
    window.dispatchEvent(new Event("braintech-wishlist"));
  }

  return (
    <div className="storefront">
      

      <section className="hero" id="top">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            PERFORMANCE, REIMAGINED
          </div>

          <h1>
            BUILD YOUR
            <br />
            DREAM <span>MACHINE.</span>
          </h1>

          <p>
            Find the components that power your next big idea — from
            competitive gaming to professional creation.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="button-primary"
              onClick={() => chooseCategory("All Products")}
            >
              Explore products <span>↗</span>
            </button>

            <button
              type="button"
              className="button-ghost"
              onClick={() => chooseCategory("PC Builds")}
            >
              Explore PC builds <span>→</span>
            </button>
          </div>

          <div className="hero-proof">
            <div className="proof-avatars">
              <span>G</span>
              <span>P</span>
              <span>⚡</span>
            </div>
            <div>
              <b>Built for every ambition</b>
              <small>Gaming · Creation · Workstations</small>
            </div>
          </div>
        </div>

        <div className="hero-art" aria-label="Gaming PC illustration">
          <div className="art-ring ring-a" />
          <div className="art-ring ring-b" />

          <div className="pc-tower">
            <div className="tower-top" />
            <div className="tower-glass">
              <div className="fan fan-one" />
              <div className="fan fan-two" />
              <div className="fan fan-three" />
              <div className="gpu-line" />
            </div>
            <div className="tower-front">
              <div className="front-light" />
              <div className="front-light" />
              <div className="front-light" />
            </div>
          </div>

          <div className="floating-chip chip-a">
            <span>✦</span>
            <div>
              <b>Next-level power</b>
              <small>Made for your setup</small>
            </div>
          </div>

          <div className="floating-chip chip-b">
            <span>↗</span>
            <div>
              <b>Performance first</b>
              <small>Choose your upgrade</small>
            </div>
          </div>

          <div className="art-caption">
            ENGINEERED TO PERFORM <span>✳</span>
          </div>
        </div>

        <div className="hero-bottom">
          <span>01 / COMPONENTS</span>
          <span className="hero-bottom-line" />
          <span>DESIGN YOUR OWN STANDARD</span>
        </div>
      </section>

      <section className="trust-strip">
        {[
          ["↗", "Reliable delivery", "Shipping options at checkout"],
          ["◇", "Genuine components", "Shop with confidence"],
          ["⌁", "Expert assistance", "Help choosing your setup"],
          ["⛨", "Warranty support", "According to product terms"],
        ].map(([icon, title, desc]) => (
          <div className="trust-item" key={title}>
            <span className="trust-icon">{icon}</span>
            <div>
              <b>{title}</b>
              <small>{desc}</small>
            </div>
          </div>
        ))}
      </section>

      <section className="category-section" id="categories">
        <div className="section-heading">
          <div>
            <span className="section-kicker">FIND YOUR NEXT UPGRADE</span>
            <h2>
              Shop by <em>category.</em>
            </h2>
            <p>
              Everything you need to build a setup that feels like yours.
            </p>
          </div>

          <button
            type="button"
            className="text-link"
            onClick={() => chooseCategory("All Products")}
          >
            Browse all products ↗
          </button>
        </div>

        <div className="category-tiles">
          {categories.map(([name, icon], i) => (
            <button
              type="button"
              key={name}
              className={`category-tile tile-${i}`}
              onClick={() => chooseCategory(name)}
            >
              <span className="tile-icon">{icon}</span>
              <span className="tile-name">{name}</span>
              <span className="tile-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>
      
      


      <section className="catalog-layout" id="catalog">
        <aside className="category-sidebar">
          <div className="sidebar-title">
            <span>☷</span>
            <div>
              <b>Browse categories</b>
              <small>Find your hardware</small>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("All Products");
              setWishlistOnly(false);
              setSpecialOnly(false);
            }}
            className={`side-category ${
              activeCategory === "All Products" ? "active" : ""
            }`}
          >
            <span>⌂</span> All products
            <span className="side-count">{products.length}</span>
          </button>

          <div className="sidebar-label">PC COMPONENTS</div>

          {categories.map(([name, icon]) => (
            <button
              type="button"
              key={name}
              onClick={() => {
                setActiveCategory(name);
                setWishlistOnly(false);
                setSpecialOnly(false);
                setSearch("");

                document
                  .getElementById("catalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`side-category ${
                activeCategory === name ? "active" : ""
              }`}
            >
              <span>{icon}</span>
              {name}
              {products.some((p) => p.category === name) && (
                <span className="side-count">
                  {products.filter((p) => p.category === name).length}
                </span>
              )}
            </button>
          ))}

          <div className="sidebar-help">
            <span>✦</span>
            <b>Need a hand?</b>
            <p>
              Not sure what fits your setup? Start with a category and
              compare your options.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("PC Builds");
                setSearch("");
                setWishlistOnly(false);
                setSpecialOnly(false);
              }}
            >
              Explore PC builds ↗
            </button>
          </div>
        </aside>

        <div className="catalog-main">
          <div className="catalog-heading">
            <div>
              <span className="section-kicker">THE HARDWARE EDIT</span>
              <h2>
                {wishlistOnly
                  ? "Your wishlist"
                  : specialOnly
                    ? "Special offers"
                    : !activeCategory || activeCategory === "All Products"
  ? "Streaming Products"
  : activeCategory}
                <span className="result-count">
  {filteredProducts.length} products
</span>
              </h2>
              <p>
                {wishlistOnly
                  ? "Products you saved for later."
                  : specialOnly
                    ? "Selected demo deals and popular picks."
                   : !activeCategory || activeCategory === "All Products"
  ? "Explore the streaming products you need."
  : `Explore ${activeCategory.toLowerCase()} for your next setup.`}
              </p>
            </div>

            <label className="sort-control">
              Sort by{" "}
              <select
                value={sort}
                onChange={(e) => {
  setSort(e.target.value);
  setProductTab("");
}}
              >
                
<option value="featured">Featured</option>
                <option value="rating">Top rated</option>

                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </label>
          </div>

       
<div className="product-tabs">
  {["Best Sellers", "New Arrivals"].map((tab) => (
    <button
      key={tab}
      type="button"
      className={`product-tab ${productTab === tab ? "active" : ""}`}
      
onClick={() => {
  setProductTab((current) => (current === tab ? "" : tab));
  setWishlistOnly(false);
  setSpecialOnly(false);
}}

    >
      {tab}
    </button>
  ))}
</div>

<div className="active-filters">
  {["All Products", ...categories.map((c) => c[0])].map(
    (cat) => (
      <button
        type="button"
        key={cat}
        
onClick={() => {
  setActiveCategory((current) => (current === cat ? "" : cat));
  setWishlistOnly(false);
  setSpecialOnly(false);
}}

        className={
          activeCategory === cat
            ? "filter-chip selected"
            : "filter-chip"
        }
      >
        {cat}
      </button>
    )
  )}
</div>


          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <span>⌕</span>
              <h3>
                {wishlistOnly
                  ? "Your wishlist is empty"
                  : search
                    ? "No matching products found"
                    : `More ${activeCategory} coming soon`}
              </h3>
              <p>
                {wishlistOnly
                  ? "Tap the heart on any product to save it here."
                  : search
                    ? "Try a different search term or browse all products."
                    : "This demo catalog is ready to be connected to your full product inventory."}
              </p>
              <button
                type="button"
                className="button-primary"
                onClick={() => {
                  setActiveCategory("All Products");
                  setSearch("");
                  setWishlistOnly(false);
                  setSpecialOnly(false);
                }}
              >
                View all products ↗
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <span className="product-badge">{product.tag}</span>

                    <button
                      type="button"
                      className={`wishlist-button ${
                        wishlist.includes(product.id) ? "wishlisted" : ""
                      }`}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Toggle wishlist"
                    >
                      {wishlist.includes(product.id) ? "♥" : "♡"}
                    </button>

                    <button
                      type="button"
                      className="quick-view-button"
                      onClick={() => setQuickView(product)}
                    >
                      Quick view <span>↗</span>
                    </button>

                    <Link
                      href={`/products/${product.id}`}
                      className="product-image-link"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-image"
                      />
                    </Link>
                  </div>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category}
                    </span>

                    <Link
                      href={`/products/${product.id}`}
                      className="product-name"
                    >
                      {product.name}
                    </Link>

                    <div className="product-rating">
                      <span>★★★★★</span>
                      <small>{product.rating} · Demo rating</small>
                    </div>

                    <div className="product-price-row">
                      <b>{formatPrice(product.price)}</b>
                      <del>{formatPrice(product.oldPrice)}</del>
                      
{product.oldPrice > product.price && (
  <span className="discount">
    {Math.round(
      (1 - product.price / product.oldPrice) * 100
    )}
    % off
  </span>
)}

                    </div>

                    {(() => {
                      const inCart = cart.find(
                        (item) => item.id === product.id
                      );

                      return inCart ? (
                        <div
                          className="card-quantity-control"
                          aria-label={`Quantity of ${product.name} in cart`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                product.id,
                                inCart.quantity - 1
                              )
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span>
                            <b>{inCart.quantity}</b>
                            <small>IN CART</small>
                          </span>
                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            aria-label="Increase quantity"
                          >
                            ＋
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="add-cart-button"
                          onClick={() => addProduct(product)}
                        >
                          <span>＋</span> Add to cart
                        </button>
                      );
                    })()}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="catalog-note">
            Showing {products.length} sample catalog items for the UI demo.
            These are not a live inventory feed; verify names, prices, stock
            and specifications before selling.
          </div>
        </div>
      </section>

      <section className="build-banner">
        <div>
          <span className="section-kicker">YOUR SETUP, YOUR RULES</span>
          <h2>
            Big ideas deserve
            <br />
            <em>better hardware.</em>
          </h2>
          <p>
            Start with a purpose. Find components that make your next build
            possible.
          </p>
          <button
            type="button"
            className="button-primary"
            onClick={() => chooseCategory("PC Builds")}
          >
            Explore PC builds ↗
          </button>
        </div>

        <div className="build-stats">
          <div>
            <b>01</b>
            <span>Choose your goal</span>
          </div>
          <div>
            <b>02</b>
            <span>Explore components</span>
          </div>
          <div>
            <b>03</b>
            <span>Build your setup</span>
          </div>
        </div>
      </section>

      {toast && (
        <div className="toast-message" role="status" aria-live="polite">
          <div className="toast-success-icon">✓</div>
          <img
            className="toast-product-image"
            src={toast.image}
            alt=""
          />
          <div className="toast-copy">
            <b>Added to your cart</b>
            <span>{toast.name}</span>
            <strong>{formatPrice(toast.price)}</strong>
          </div>
          <Link href="/cart" className="toast-view-cart">
            View cart <span>↗</span>
          </Link>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {quickView && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setQuickView(null)}
        >
          <section
            className="quick-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Quick product view"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setQuickView(null)}
              aria-label="Close quick view"
            >
              ×
            </button>

            <div className="modal-image">
              <img src={quickView.image} alt={quickView.name} />
            </div>

            <div className="modal-details">
              <span className="section-kicker">
                {quickView.category}
              </span>
              <h2>{quickView.name}</h2>

              <div className="product-rating">
                <span>★★★★★</span>
                <small>{quickView.rating} · Demo rating</small>
              </div>

              <div className="modal-price">
                {formatPrice(quickView.price)}{" "}
                <del>{formatPrice(quickView.oldPrice)}</del>
              </div>

              <p>{quickView.description}</p>

              <ul>
                <li>✓ Product information preview</li>
                <li>✓ Add to cart for this demo</li>
                <li>✓ Verify specs and availability before purchase</li>
              </ul>

              {(() => {
                const inCart = cart.find(
                  (item) => item.id === quickView.id
                );

                return inCart ? (
                  <div className="modal-quantity-row">
                    <span>{inCart.quantity} in your cart</span>
                    <div className="card-quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            quickView.id,
                            inCart.quantity - 1
                          )
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <b>{inCart.quantity}</b>
                      <button
                        type="button"
                        onClick={() => addProduct(quickView)}
                        aria-label="Increase quantity"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="add-cart-button"
                    onClick={() => addProduct(quickView)}
                  >
                    ＋ Add to cart
                  </button>
                );
              })()}

              <Link
                className="modal-product-link"
                href={`/products/${quickView.id}`}
              >
                View full product details ↗
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
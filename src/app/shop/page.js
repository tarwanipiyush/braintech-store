
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import HomepageBanners from "../components/HomepageBanners";
import Link from "next/link";
import AddToCartControl from "../components/AddToCartControl";
import CategoryTiles from "../components/CategoryTiles";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import {
  products as seedProducts,
  categories as seedCategories,
} from "@/data/products";

const formatPrice = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

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

const GAMING_CATEGORIES = [
  "Mouse",
  "Keyboards",
  "Headphones",
  "Mousepad",
];

function subscribeWishlist(callback) {
  if (typeof window === "undefined") return () => {};

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

// Infer a brand from the available product name.
// Add more brand rules here as your catalogue grows.
function getProductBrand(product) {
  return String(product.brand ?? "").trim();
}

// Category-specific options are inferred only from the available name/category.
// They are not a substitute for verified manufacturer specifications.

function getProductAttributes(product) {
  const specifications = Array.isArray(product.specifications)
    ? product.specifications
    : [];

  return specifications
    .filter((spec) => {
      return (
        spec.field_label &&
        spec.value !== null &&
        spec.value !== undefined &&
        String(spec.value).trim() !== ""
      );
    })
    .map((spec) => {
      const label = String(spec.field_label).trim();
      const value = String(spec.value).trim();
      const unit = String(spec.unit_label ?? "").trim();

      const displayValue =
        unit && !value.toLowerCase().endsWith(unit.toLowerCase())
          ? `${value} ${unit}`
          : value;

      return `${label}: ${displayValue}`;
    });
}


function getAvailableAttributes(categoryProducts) {
  const values = new Set();

  categoryProducts.forEach((product) => {
    getProductAttributes(product).forEach((value) => values.add(value));
  });

  return [...values].sort((a, b) => a.localeCompare(b));
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="storefront" style={{ minHeight: "50vh" }} />}>
      <ShopFromUrl />
    </Suspense>
  );
}

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
  const hasInitialFilter =
    !!initial.category || !!initial.q || initial.special || initial.wishlist;

  const { cart, addToCart, updateQuantity } = useCart();
  const [products, setProducts] = useState(seedProducts);
const [categories, setCategories] = useState(seedCategories);
const [productsLoading, setProductsLoading] = useState(true);
const [productsError, setProductsError] = useState("");

useEffect(() => {
  let cancelled = false;

  async function loadProducts() {
    try {
      setProductsLoading(true);
      setProductsError("");


const response = await fetch(
  "/api/store/products",
  { cache: "no-store" }
);

      if (!response.ok) {
        throw new Error("Could not connect to the product API.");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(data.message || "Invalid product data received.");
      }

      if (cancelled) return;

const liveProducts = data.products.map((item) => {
  const price = Number(item.price ?? 0);
  const oldPrice = Number(
    item.compare_at_price ?? item.oldPrice ?? item.old_price ?? price
  );

  const stockQuantity = Number(item.stock_quantity ?? 0);

  return {
    ...item,
    id: Number(item.id),
    name: item.name ?? item.title ?? "Unnamed product",
    category: item.category_name ?? item.category ?? "",
    price,
    oldPrice,
    image:
      item.image_url ??
      item.image ??
      "/images/product-placeholder.png",
    stockQuantity,
    stock_quantity: stockQuantity,
    tag: item.is_special_offer ? "Special Offer" : "",
rating: item.rating != null ? Number(item.rating) : null,    description: item.description ?? "",
    features: Array.isArray(item.features) ? item.features : [],
    specifications: Array.isArray(item.specifications)
  ? item.specifications
  : [],
   brand: item.brand ?? "",
sku: item.sku ?? "",
created_at: item.created_at ?? null,
  };
});

      const liveCategories = Array.isArray(data.categories)
        ? data.categories.map((item) => [item.name, "◈"])
        : [];

      setProducts(liveProducts);
      setCategories(liveCategories);
    } catch (error) {
      if (!cancelled) {
        setProductsError(
          error.message || "Unable to load products from the server."
        );
      }
    } finally {
      if (!cancelled) {
        setProductsLoading(false);
      }
    }
  }

  loadProducts();

  return () => {
    cancelled = true;
  };
}, []);

useEffect(() => {
  let cancelled = false;

  async function loadBestSellers() {
    try {
      const response = await fetch("/api/store/best-sellers", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load Best Sellers.");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.best_sellers)) {
        throw new Error(data.message || "Invalid Best Sellers data.");
      }

      const ids = data.best_sellers
        .map((item) => Number(item.product_id))
        .filter((id) => Number.isFinite(id));

      if (!cancelled) {
        setBestSellerIds(ids);
      }
    } catch (error) {
      console.error("Best Sellers loading error:", error);

      if (!cancelled) {
        setBestSellerIds([]);
      }
    }
  }

  loadBestSellers();

  return () => {
    cancelled = true;
  };
}, []);


  const [search, setSearch] = useState(initial.q);
  const [activeCategory, setActiveCategory] = useState(
    initial.category || (hasInitialFilter ? "All Products" : "")
  );
  const [sort, setSort] = useState("featured");

  const wishlistRaw = useSyncExternalStore(
    subscribeWishlist,
    readWishlistRaw,
    () => "[]"
  );

  const wishlist = useMemo(() => parseWishlist(wishlistRaw), [wishlistRaw]);

  const [wishlistOnly, setWishlistOnly] = useState(initial.wishlist);
  const [specialOnly, setSpecialOnly] = useState(initial.special);
  const [productTab, setProductTab] = useState("");
  const [bestSellerIds, setBestSellerIds] = useState([]);
  const [quickView, setQuickView] = useState(null);

  // Category-specific filter state.
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    if (!hasInitialFilter) return;

    const timer = window.setTimeout(() => {
      document
        .getElementById("catalog")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [hasInitialFilter]);

  // Products available in the selected category, before the other filters.
  const categoryProducts = useMemo(() => {
    return products.filter((product) => {
      if (!activeCategory || activeCategory === "All Products") return true;

      if (product.category === activeCategory) return true;

      if (
        activeCategory === "Gaming Gears" &&
        GAMING_CATEGORIES.includes(product.category)
      ) {
        return true;
      }

      if (
        activeCategory === "Components" &&
        COMPONENT_CATEGORIES.includes(product.category)
      ) {
        return true;
      }

      return false;
    });
  }, [products, activeCategory]);

  const availableBrands = useMemo(() => {
  return [
    ...new Set(
      categoryProducts
        .map(getProductBrand)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
}, [categoryProducts]); [categoryProducts];

  const availableAttributes = useMemo(
    () => getAvailableAttributes(categoryProducts),
    [categoryProducts]
  );

  const categoryPriceBounds = useMemo(() => {
    const prices = categoryProducts
      .map((product) => Number(product.price))
      .filter((price) => Number.isFinite(price) && price >= 0);

    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [categoryProducts]);

  const activeFilterCount =
    selectedBrands.length +
    selectedAttributes.length +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let result = categoryProducts.filter((product) => {
      const searchTerm = search.trim().toLowerCase();

      const searchableText = [
        product.name || "",
        product.category || "",
        product.tag || "",
        product.description || "",
        getProductBrand(product),
        ...getProductAttributes(product),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm);
      const matchesWishlist = !wishlistOnly || wishlist.includes(product.id);

     const matchesSpecial =
  !specialOnly || Number(product.is_special_offer) === 1;

     const productCreatedAt = product.created_at
  ? new Date(product.created_at)
  : null;

const matchesProductTab =
  productTab === "" ||
  productTab === "New Arrivals" ||
  (productTab === "Best Sellers" &&
    bestSellerIds.includes(Number(product.id)));
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(getProductBrand(product));

      const productAttributes = getProductAttributes(product);

      const matchesAttributes =
        selectedAttributes.length === 0 ||
        selectedAttributes.some((attribute) =>
          productAttributes.includes(attribute)
        );

      const price = Number(product.price) || 0;
      const matchesMinPrice =
        minPrice === "" || price >= Number(minPrice);
      const matchesMaxPrice =
        maxPrice === "" || price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesWishlist &&
        matchesSpecial &&
        matchesProductTab &&
        matchesBrand &&
        matchesAttributes &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

   if (productTab === "New Arrivals") {
  result = [...result]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 8);
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


 return result;
}, [
  categoryProducts,
  search,
  wishlistOnly,
  wishlist,
  specialOnly,
  productTab,
  bestSellerIds,
  selectedBrands,
  selectedAttributes,
  minPrice,
  maxPrice,
  sort,
]);

  function resetCategoryFilters() {
    setSelectedBrands([]);
    setSelectedAttributes([]);
    setMinPrice("");
    setMaxPrice("");
  }

  function chooseCategory(category) {
    setActiveCategory(category);
    setSearch("");
    setWishlistOnly(false);
    setSpecialOnly(false);
    setProductTab("");
    resetCategoryFilters();

    document
      .getElementById("catalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleBrand(brand) {
    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand]
    );
  }

  function toggleAttribute(attribute) {
    setSelectedAttributes((current) =>
      current.includes(attribute)
        ? current.filter((item) => item !== attribute)
        : [...current, attribute]
    );
  }

  function addProduct(product) {
    addToCart(product);
  }

  function toggleWishlist(id) {
    const next = wishlist.includes(id)
      ? wishlist.filter((item) => item !== id)
      : [...wishlist, id];

    try {
      localStorage.setItem("braintech-wishlist", JSON.stringify(next));
    } catch {
      // Ignore unavailable storage.
    }

    window.dispatchEvent(new Event("braintech-wishlist"));
  }

  function clearAllFilters() {
    setSearch("");
    setActiveCategory("All Products");
    setWishlistOnly(false);
    setSpecialOnly(false);
    setProductTab("");
    setSort("featured");
    resetCategoryFilters();

    router.replace("/shop", { scroll: false });
  }

return (
    <div className="storefront">
      <HomepageBanners page="shop" placement="top" />

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
      <HomepageBanners page="shop" placement="below_hero" />

      <section className="trust-strip"></section>
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

      <CategoryTiles active={activeCategory} onSelect={chooseCategory} />
</section>

<HomepageBanners page="shop" placement="between_sections" />

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
            onClick={() => chooseCategory("All Products")}
            className={`side-category ${
              !activeCategory || activeCategory === "All Products"
                ? "active"
                : ""
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
              onClick={() => chooseCategory(name)}
              className={`side-category ${
                activeCategory === name ? "active" : ""
              }`}
            >
              <span>{icon}</span>
              {name}
              <span className="side-count">
                {products.filter((p) => p.category === name).length}
              </span>
            </button>
          ))}

{/* Category-aware product filters — left sidebar */}
<section
  className="bt-category-filters"
  aria-label="Product filters"
>
  <div className="bt-filter-heading">
    <div>
      <h3>Filter products</h3>
      <p>
        {activeCategory && activeCategory !== "All Products"
          ? `Filters for ${activeCategory}`
          : "Refine your selection"}
      </p>
    </div>

    <button
      type="button"
      onClick={() => setFiltersOpen((open) => !open)}
    >
      {filtersOpen ? "Hide" : "Show"}
    </button>
  </div>

  {filtersOpen && (
    <div className="bt-filter-options">
      <div className="bt-filter-group">
        <h4>Price range</h4>

        <label htmlFor="shop-min-price">Minimum (₹)</label>
        <input
          id="shop-min-price"
          type="number"
          min="0"
          placeholder={String(categoryPriceBounds.min)}
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
        />

        <label htmlFor="shop-max-price">Maximum (₹)</label>
        <input
          id="shop-max-price"
          type="number"
          min="0"
          placeholder={String(categoryPriceBounds.max)}
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />
      </div>

      <div className="bt-filter-group">
        <h4>Brand</h4>

        {availableBrands.length ? (
          availableBrands.map((brand) => (
            <label className="bt-filter-checkbox" key={brand}>
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
              />
              <span>{brand}</span>
              <small>
                {
                  categoryProducts.filter(
                    (product) => getProductBrand(product) === brand
                  ).length
                }
              </small>
            </label>
          ))
        ) : (
          <p>No brands available.</p>
        )}
      </div>

      {availableAttributes.length > 0 && (
        <div className="bt-filter-group">
          <h4>
            {activeCategory === "RAM"
              ? "Memory type / features"
              : activeCategory === "Graphic Cards"
                ? "GPU family / memory"
                : activeCategory === "Processors"
                  ? "Processor family"
                  : activeCategory === "Motherboards"
                    ? "Platform / memory"
                    : activeCategory === "Power Supply"
                      ? "Wattage / efficiency"
                      : activeCategory === "SSD"
                        ? "Storage type / capacity"
                        : activeCategory === "Monitors"
                          ? "Display features"
                          : activeCategory === "CPU Cooler"
                            ? "Cooling type"
                            : "Product features"}
          </h4>

          {availableAttributes.map((attribute) => (
            <label className="bt-filter-checkbox" key={attribute}>
              <input
                type="checkbox"
                checked={selectedAttributes.includes(attribute)}
                onChange={() => toggleAttribute(attribute)}
              />
              <span>{attribute}</span>
              <small>
                {
                  categoryProducts.filter((product) =>
                    getProductAttributes(product).includes(attribute)
                  ).length
                }
              </small>
            </label>
          ))}
        </div>
      )}

      <div className="bt-filter-footer">
        <span>{activeFilterCount} active</span>
        <button type="button" onClick={resetCategoryFilters}>
          Clear filters
        </button>
      </div>
    </div>
  )}
</section>


          <div className="sidebar-help">
            <span>✦</span>
            <b>Need a hand?</b>
            <p>
              Not sure what fits your setup? Start with a category and
              compare your options.
            </p>
            <button
              type="button"
              onClick={() => chooseCategory("PC Builds")}
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
                      ? "Explore Products"
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
                      ? "Explore the catalog and filter products to find your next upgrade."
                      : `Explore ${activeCategory.toLowerCase()} and narrow your options.`}
              </p>
            </div>

            <label className="sort-control">
              Sort by{" "}
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
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
            {["All Products", ...categories.map((category) => category[0])].map(
              (category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => chooseCategory(category)}
                  className={
                    activeCategory === category ||
                    (!activeCategory && category === "All Products")
                      ? "filter-chip selected"
                      : "filter-chip"
                  }
                >
                  {category}
                </button>
              )
            )}
          </div>

          {/* Category-aware product filters */}


          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
              margin: "12px 0 18px",
            }}
          >
            <label style={{ flex: "1 1 220px" }}>
              <span style={{ display: "block", fontSize: "12px", marginBottom: "5px", opacity: 0.7 }}>
                Search products
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, brands or features..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.22)",
                  color: "inherit",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setWishlistOnly((value) => !value);
                setSpecialOnly(false);
              }}
              className={`filter-chip ${wishlistOnly ? "selected" : ""}`}
            >
              {wishlistOnly ? "♥ Wishlist selected" : "♡ Wishlist"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSpecialOnly((value) => !value);
                setWishlistOnly(false);
              }}
              className={`filter-chip ${specialOnly ? "selected" : ""}`}
            >
              {specialOnly ? "★ Offers selected" : "★ Special offers"}
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <span>⌕</span>
              <h3>
                {wishlistOnly
                  ? "Your wishlist is empty or has no matching products"
                  : "No matching products found"}
              </h3>
              <p>
                Try removing a filter, changing your price range, or selecting
                another category.
              </p>
              <button
                type="button"
                className="button-primary"
                onClick={clearAllFilters}
              >
                Clear filters and view all products ↗
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
                      aria-label={
                        wishlist.includes(product.id)
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
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
                    <span className="product-category">{product.category}</span>

                    <Link
                      href={`/products/${product.id}`}
                      className="product-name"
                    >
                      {product.name}
                    </Link>

                    <div className="product-rating">
  <small>No customer ratings yet</small>
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

                    <AddToCartControl product={product} />
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="catalog-note">
  {productsLoading
    ? "Connecting to the BrainTech product catalogue..."
    : productsError
      ? `Live catalogue unavailable: ${productsError}`
      : `Showing live catalogue data: ${filteredProducts.length} of ${categoryProducts.length} products in this selection.`}
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

      <HomepageBanners page="shop" placement="before_footer" />

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
            onClick={(event) => event.stopPropagation()}
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
              <span className="section-kicker">{quickView.category}</span>
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
                {(quickView.features || []).map((feature, index) => (
                  <li key={`${quickView.id}-feature-${index}`}>✓ {feature}</li>
                ))}
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

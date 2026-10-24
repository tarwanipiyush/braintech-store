
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import AddToCartControl from "../components/AddToCartControl";
import CategoryTiles from "../components/CategoryTiles";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { products, categories } from "@/data/products";

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
  const name = (product.name || "").toLowerCase();

  const brands = [
    ["amd", "AMD"],
    ["intel", "Intel"],
    ["nvidia", "NVIDIA"],
    ["geforce", "NVIDIA"],
    ["radeon", "AMD"],
    ["asus", "ASUS"],
    ["msi", "MSI"],
    ["gigabyte", "Gigabyte"],
    ["asrock", "ASRock"],
    ["corsair", "Corsair"],
    ["logitech", "Logitech"],
    ["razer", "Razer"],
    ["hyperx", "HyperX"],
    ["cooler master", "Cooler Master"],
    ["deepcool", "DeepCool"],
    ["kingston", "Kingston"],
    ["samsung", "Samsung"],
    ["western digital", "Western Digital"],
    ["wd ", "Western Digital"],
    ["crucial", "Crucial"],
    ["seagate", "Seagate"],
    ["nzxt", "NZXT"],
    ["lian li", "Lian Li"],
    ["antec", "Antec"],
    ["thermaltake", "Thermaltake"],
    ["fractal", "Fractal Design"],
    ["acer", "Acer"],
    ["lg ", "LG"],
    ["dell", "Dell"],
    ["benq", "BenQ"],
    ["viewsonic", "ViewSonic"],
    ["lenovo", "Lenovo"],
    ["hp ", "HP"],
    ["zotac", "Zotac"],
    ["sapphire", "Sapphire"],
    ["palit", "Palit"],
    ["pny", "PNY"],
    ["teamgroup", "TeamGroup"],
    ["g.skill", "G.Skill"],
    ["xpg", "XPG"],
    ["adata", "ADATA"],
    ["ant esports", "Ant Esports"],
  ];

  const match = brands.find(([needle]) => name.includes(needle));

  return match ? match[1] : "Other";
}

// Category-specific options are inferred only from the available name/category.
// They are not a substitute for verified manufacturer specifications.
function getProductAttributes(product) {
  const name = (product.name || "").toLowerCase();
  const category = product.category;

  switch (category) {
    case "Processors": {
      const options = [];

      if (name.includes("amd") || name.includes("ryzen")) {
        options.push("AMD");
      }

      if (name.includes("intel") || name.includes("core i")) {
        options.push("Intel");
      }

      if (name.includes("ryzen 9")) options.push("Ryzen 9");
      else if (name.includes("ryzen 7")) options.push("Ryzen 7");
      else if (name.includes("ryzen 5")) options.push("Ryzen 5");
      else if (name.includes("ryzen 3")) options.push("Ryzen 3");

      if (/core ultra 9|core i9/.test(name)) options.push("Core i9 / Ultra 9");
      else if (/core ultra 7|core i7/.test(name)) options.push("Core i7 / Ultra 7");
      else if (/core ultra 5|core i5/.test(name)) options.push("Core i5 / Ultra 5");
      else if (/core i3/.test(name)) options.push("Core i3");

      return options;
    }

    case "Motherboards": {
      const options = [];

      if (/\bam5\b/.test(name)) options.push("AM5");
      if (/\bam4\b/.test(name)) options.push("AM4");
      if (/\blga\s*1700\b/.test(name)) options.push("LGA 1700");
      if (/\blga\s*1851\b/.test(name)) options.push("LGA 1851");
      if (/\bddr5\b/.test(name)) options.push("DDR5");
      if (/\bddr4\b/.test(name)) options.push("DDR4");
      if (/\bx870\b|\bx670\b|\bx570\b/.test(name)) options.push("AMD X-series");
      if (/\bb850\b|\bb650\b|\bb550\b/.test(name)) options.push("AMD B-series");
      if (/\bz890\b|\bz790\b|\bz690\b/.test(name)) options.push("Intel Z-series");
      if (/\bb860\b|\bb760\b|\bb660\b/.test(name)) options.push("Intel B-series");

      return options;
    }

    case "Graphic Cards": {
      const options = [];

      if (/nvidia|geforce|rtx|gtx/.test(name)) options.push("NVIDIA");
      if (/amd|radeon|rx\s*\d/.test(name)) options.push("AMD Radeon");

      const vram = name.match(/\b(4|6|8|10|12|16|20|24|32)\s*gb\b/i);
      if (vram) options.push(`${vram[1]} GB`);

      if (/rtx\s*50\d{2}/.test(name)) options.push("RTX 50 Series");
      else if (/rtx\s*40\d{2}/.test(name)) options.push("RTX 40 Series");
      else if (/rtx\s*30\d{2}/.test(name)) options.push("RTX 30 Series");
      else if (/rx\s*9\d{3}/.test(name)) options.push("Radeon RX 9000 Series");
      else if (/rx\s*7\d{3}/.test(name)) options.push("Radeon RX 7000 Series");
      else if (/rx\s*6\d{3}/.test(name)) options.push("Radeon RX 6000 Series");

      return options;
    }

    case "Power Supply": {
      const options = [];
      const wattage = name.match(/\b(450|500|550|600|650|700|750|800|850|900|1000|1200|1300|1500)\s*w\b/i);

      if (wattage) options.push(`${wattage[1]} W`);

      if (/80\+\s*gold|80 plus gold|gold/i.test(name)) options.push("80 Plus Gold");
      else if (/80\+\s*bronze|80 plus bronze|bronze/i.test(name)) options.push("80 Plus Bronze");
      else if (/80\+\s*platinum|80 plus platinum|platinum/i.test(name)) options.push("80 Plus Platinum");

      return options;
    }

    case "RAM": {
      const options = [];

      if (/\bddr5\b/.test(name)) options.push("DDR5");
      if (/\bddr4\b/.test(name)) options.push("DDR4");

      const capacity = name.match(/\b(8|16|24|32|48|64|96|128)\s*gb\b/i);
      if (capacity) options.push(`${capacity[1]} GB`);

      if (/rgb/i.test(name)) options.push("RGB");

      return options;
    }

    case "SSD": {
      const options = [];

      if (/nvme/i.test(name)) options.push("NVMe");
      if (/sata/i.test(name)) options.push("SATA");
      if (/m\.2/i.test(name)) options.push("M.2");

      const capacity = name.match(/\b(120|128|240|250|256|480|500|512|960|1000|1024|2000|2048|4000|4096)\s*(gb|tb)\b/i);

      if (capacity) {
        const number = Number(capacity[1]);
        const unit = capacity[2].toLowerCase();
        const display = unit === "tb" ? `${number} TB` : `${number} GB`;
        options.push(display);
      }

      return options;
    }

    case "CPU Cooler": {
      const options = [];

      if (/aio|liquid|water cooler|watercool/i.test(name)) {
        options.push("Liquid cooling");
      } else if (/air cooler|tower cooler|heatsink/i.test(name)) {
        options.push("Air cooling");
      }

      if (/rgb/i.test(name)) options.push("RGB");

      return options;
    }

    case "Monitors": {
      const options = [];

      const refresh = name.match(/\b(60|75|100|120|144|165|170|180|200|240|280|300|360|480)\s*hz\b/i);
      if (refresh) options.push(`${refresh[1]} Hz`);

      if (/oled/i.test(name)) options.push("OLED");
      else if (/ips/i.test(name)) options.push("IPS");
      else if (/va panel|\bva\b/i.test(name)) options.push("VA");

      if (/4k|2160p|uhd/i.test(name)) options.push("4K");
      else if (/1440p|2k|qhd/i.test(name)) options.push("1440p / QHD");
      else if (/1080p|fhd/i.test(name)) options.push("1080p / FHD");

      return options;
    }

    case "Mouse":
    case "Keyboards":
    case "Headphones": {
      const options = [];

      if (/wireless|bluetooth|2\.4ghz/i.test(name)) options.push("Wireless");
      if (/wired|usb wired/i.test(name)) options.push("Wired");
      if (/rgb/i.test(name)) options.push("RGB");
      if (/mechanical/i.test(name)) options.push("Mechanical");

      return options;
    }

    case "PC Cabinet": {
      const options = [];

      if (/mini[- ]?tower|mini itx/i.test(name)) options.push("Mini / compact");
      if (/mid[- ]?tower/i.test(name)) options.push("Mid tower");
      if (/full[- ]?tower/i.test(name)) options.push("Full tower");
      if (/rgb/i.test(name)) options.push("RGB");

      return options;
    }

    default:
      return [];
  }
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
  }, [activeCategory]);

  const availableBrands = useMemo(() => {
    return [
      ...new Set(categoryProducts.map(getProductBrand)),
    ].sort((a, b) => a.localeCompare(b));
  }, [categoryProducts]);

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
        !specialOnly ||
        ["Monitor deal", "Hot pick", "Deal", "Bestseller"].includes(
          product.tag
        );

      const matchesProductTab =
        productTab === "" ||
        (productTab === "Best Sellers" &&
          ["Bestseller", "Hot pick"].includes(product.tag)) ||
        (productTab === "New Arrivals" && product.id >= 179);

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
    categoryProducts,
    search,
    wishlistOnly,
    wishlist,
    specialOnly,
    productTab,
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

        <CategoryTiles active={activeCategory} onSelect={chooseCategory} />
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

                    <AddToCartControl product={product} />
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="catalog-note">
            Showing {filteredProducts.length} of {categoryProducts.length} items
            in this selection. This is a sample catalog, not a live inventory
            feed. Verify specifications, prices, stock and warranty before
            selling.
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "@/context/CartContext";
import { categories, products } from "@/data/products";

/* Pages that have their own checkout / auth layout and should not show the store header. */
const HIDDEN_ON = ["/cart", "/login", "/register", "/forgot-password"];

const GAMING_CATEGORIES = ["Mouse", "Keyboards", "Headphones", "Mousepad"];
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

const money = (value) => `₹${new Intl.NumberFormat("en-IN").format(value)}`;
const shopLink = (params) => `/shop?${new URLSearchParams(params).toString()}`;
const byCategory = (name) => products.filter((p) => p.category === name);
const discount = (p) => Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);

/* ---------- wishlist count (shared with the shop page through localStorage) ---------- */

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

/* ---------- dropdown content ---------- */

function buildMenus() {
  // PC builds grouped by use case ("Video Editing PC — Ryzen 5 …" -> "Video Editing PC")
  const groups = new Map();
  byCategory("PC Builds").forEach((p) => {
    const name = p.name.includes(" — ") ? p.name.split(" — ")[0] : "Featured builds";
    groups.set(name, [...(groups.get(name) || []), p]);
  });
  const buildColumns = [];
  const featured = [];
  groups.forEach((items, title) => {
    if (items.length >= 3) {
      buildColumns.push({ title, href: shopLink({ q: title }), items: items.slice(0, 3) });
    } else {
      featured.push(...items);
    }
  });
  if (featured.length) {
    buildColumns.push({ title: "Featured builds", href: shopLink({ category: "PC Builds" }), items: featured.slice(0, 3) });
  }

  return {
    Streaming: {
      kind: "cards",
      title: "Streaming-ready PCs",
      items: products.filter((p) => /streaming/i.test(p.name)).slice(0, 4),
      viewAll: { label: "View all streaming PCs", href: shopLink({ q: "Streaming" }) },
    },
    "Gaming Gears": {
      kind: "columns",
      columns: GAMING_CATEGORIES.map((name) => ({
        title: name,
        href: shopLink({ category: name }),
        items: byCategory(name).slice(0, 3),
      })),
      viewAll: { label: "View all gaming gear", href: shopLink({ category: "Gaming Gears" }) },
    },
    Components: {
      kind: "columns",
      columns: COMPONENT_CATEGORIES.map((name) => ({
        title: name,
        href: shopLink({ category: name }),
        items: byCategory(name).slice(0, 3),
      })),
      viewAll: { label: "View all components", href: shopLink({ category: "Components" }) },
    },
    "PC Builds": {
      kind: "columns",
      columns: buildColumns.slice(0, 8),
      viewAll: { label: "View all PC builds", href: shopLink({ category: "PC Builds" }) },
    },
    Monitors: {
      kind: "cards",
      title: "Gaming & creator monitors",
      items: byCategory("Monitors").slice(0, 4),
      viewAll: { label: "View all monitors", href: shopLink({ category: "Monitors" }) },
    },
    "Special Offers": {
      kind: "cards",
      title: "Biggest price drops",
      badge: true,
      items: [...products].sort((a, b) => discount(b) - discount(a)).slice(0, 4),
      viewAll: { label: "View all offers", href: shopLink({ special: "1" }) },
    },
  };
}

/* ---------- small presentational pieces ---------- */

function ProductRow({ product, onNavigate }) {
  return (
    <Link href={`/products/${product.id}`} className="bt-prod" onClick={onNavigate}>
      <img src={product.image} alt="" loading="lazy" />
      <span>
        <b>{product.name}</b>
        <em>{money(product.price)}</em>
      </span>
    </Link>
  );
}

function ProductCard({ product, badge, onNavigate }) {
  return (
    <Link href={`/products/${product.id}`} className="bt-card" onClick={onNavigate}>
      <span className="bt-card-img">
        <img src={product.image} alt="" loading="lazy" />
        {badge && <i>-{discount(product)}%</i>}
      </span>
      <b>{product.name}</b>
      <span className="bt-card-price">
        {money(product.price)} <del>{money(product.oldPrice)}</del>
      </span>
    </Link>
  );
}

function ViewAll({ link, onNavigate }) {
  return (
    <Link href={link.href} className="bt-viewall" onClick={onNavigate}>
      {link.label} →
    </Link>
  );
}

function Panel({ menu, onNavigate }) {
  if (menu.kind === "columns") {
    return (
      <>
        <div className="bt-cols">
          {menu.columns.map((col) => (
            <div key={col.title} className="bt-col">
              <Link href={col.href} className="bt-coltitle" onClick={onNavigate}>
                {col.title} <span>→</span>
              </Link>
              {col.items.map((p) => (
                <ProductRow key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>
        <ViewAll link={menu.viewAll} onNavigate={onNavigate} />
      </>
    );
  }

  return (
    <>
      <p className="bt-panel-title">{menu.title}</p>
      <div className="bt-cards">
        {menu.items.map((p) => (
          <ProductCard key={p.id} product={p} badge={menu.badge} onNavigate={onNavigate} />
        ))}
      </div>
      <ViewAll link={menu.viewAll} onNavigate={onNavigate} />
    </>
  );
}

function BrowsePanel({ onNavigate }) {
  const [active, setActive] = useState(categories[0][0]);
  const items = byCategory(active).slice(0, 4);

  return (
    <div className="bt-browse">
      <ul className="bt-browse-list">
        {categories.map(([name, icon]) => (
          <li key={name}>
            <Link
              href={shopLink({ category: name })}
              className={name === active ? "active" : ""}
              onMouseEnter={() => setActive(name)}
              onFocus={() => setActive(name)}
              onClick={onNavigate}
            >
              <span>{icon}</span>
              {name}
              <i>›</i>
            </Link>
          </li>
        ))}
      </ul>

      <div className="bt-browse-products">
        <p className="bt-panel-title">{active}</p>
        <div className="bt-cards">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
          ))}
        </div>
        <ViewAll link={{ label: `View all ${active}`, href: shopLink({ category: active }) }} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/* ---------- the header ---------- */

// One nav entry. Opens on hover / keyboard focus, closes on leave, blur or Escape.
function NavItem({ id, openKey, onOpen, onLeave, onClose, className = "", hasMenu = true, children }) {
  const events = hasMenu
    ? {
        onMouseEnter: () => onOpen(id),
        onMouseLeave: () => onLeave(),
        onFocus: () => onOpen(id),
        onBlur: (event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onLeave();
        },
        onKeyDown: (event) => {
          if (event.key === "Escape") onClose();
        },
      }
    : {};

  return (
    <div className={`bt-item ${className} ${openKey === id ? "is-open" : ""}`} {...events}>
      {children}
    </div>
  );
}

const NAV = [
  { key: "Home", href: "/" },
  { key: "Streaming", href: shopLink({ q: "Streaming" }), menu: true },
  { key: "Gaming Gears", href: shopLink({ category: "Gaming Gears" }), menu: true },
  { key: "Components", href: shopLink({ category: "Components" }), menu: true },
  { key: "PC Builds", href: shopLink({ category: "PC Builds" }), menu: true },
  { key: "Monitors", href: shopLink({ category: "Monitors" }), menu: true },
  { key: "Special Offers", href: shopLink({ special: "1" }), menu: true },
  { key: "Build It Yourself", href: "/build-it-yourself", badge: "NEW" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();

  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);
  const [pinned, setPinned] = useState(false); // Browse Categories opened by a click
  const closeTimer = useRef(null);

  const menus = useMemo(() => buildMenus(), []);

  const wishlistRaw = useSyncExternalStore(subscribeWishlist, readWishlistRaw, () => "[]");
  const wishlistCount = useMemo(() => {
    try {
      const list = JSON.parse(wishlistRaw);
      return Array.isArray(list) ? list.length : 0;
    } catch {
      return 0;
    }
  }, [wishlistRaw]);

  // A clicked (pinned) menu stays open until you click elsewhere, press Escape or pick a link.
  useEffect(() => {
    if (!pinned) return undefined;
    function onDown(event) {
      if (!event.target.closest?.(".bt-nav")) {
        setPinned(false);
        setOpenKey(null);
      }
    }
    function onKey(event) {
      if (event.key === "Escape") {
        setPinned(false);
        setOpenKey(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  if (HIDDEN_ON.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  const openMenu = (key) => {
    window.clearTimeout(closeTimer.current);
    setOpenKey(key);
  };
  const scheduleClose = () => {
    if (pinned) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenKey(null), 160);
  };
  const closeNow = () => {
    window.clearTimeout(closeTimer.current);
    setPinned(false);
    setOpenKey(null);
  };

  function toggleBrowse() {
    window.clearTimeout(closeTimer.current);
    if (pinned) {
      setPinned(false);
      setOpenKey(null);
    } else {
      setPinned(true);
      setOpenKey("browse");
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    const q = search.trim();
    router.push(q ? shopLink({ q }) : "/shop");
  }

  function goHome(event) {
    closeNow();
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <>
      <div className="announcement">
        <span>YOUR ONE-STOP DESTINATION FOR COMPUTER HARDWARE</span>
        <span className="announcement-right">Expert help · Genuine components · Built for performance</span>
      </div>

      <header className="site-header">
        <div className="header-main">
          <Link href="/" className="brand" aria-label="Brain Tech PC home">
            <span className="brand-mark">B</span>
            <span>
              <b>BRAINTECH</b>
              <small>PC COMPONENTS & BUILDS</small>
            </span>
          </Link>

          <form className="search-box" onSubmit={submitSearch}>
            <span className="search-icon">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search processors, graphics cards, monitors..."
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>

          <div className="header-actions">
            <Link href="/#categories" className="header-action">
              <span>☷</span>
              <small>Categories</small>
            </Link>

            <Link href="/shop?wishlist=1" className="header-action">
              <span>
                ♡<i>{wishlistCount}</i>
              </span>
              <small>Wishlist</small>
            </Link>

            <Link href="/cart" className="header-action cart-header-action">
              <span className="cart-header-icon">
                🛒
                <i key={cartCount} className="cart-count-badge">
                  {cartCount}
                </i>
              </span>
              <small>
                Cart <b className="cart-items-label">({cartCount})</b>
              </small>
            </Link>

            <div className="auth-header-links">
              <Link href="/login" className="auth-login-link">
                Sign In
              </Link>
              <Link href="/register" className="auth-register-link">
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <nav className="bt-nav" aria-label="Main navigation">
          <div className="bt-nav-inner">
            {/* Browse Categories */}
            <NavItem id="browse" openKey={openKey} onOpen={openMenu} onLeave={scheduleClose} onClose={closeNow}>
              <button
                type="button"
                className={`bt-link bt-browse-btn ${pinned ? "is-pinned" : ""}`}
                onClick={toggleBrowse}
                aria-haspopup="true"
                aria-expanded={openKey === "browse"}
              >
                ☰ <span>Browse Categories</span> <i className="bt-chevron">▾</i>
              </button>
              {openKey === "browse" && (
                <div className="bt-panel bt-panel-wide" role="menu">
                  <BrowsePanel onNavigate={closeNow} />
                </div>
              )}
            </NavItem>

            {NAV.map((item) => (
              <NavItem
                key={item.key}
                id={item.key}
                openKey={openKey}
                onOpen={openMenu}
                onLeave={scheduleClose}
                onClose={closeNow}
                hasMenu={Boolean(item.menu)}
              >
                <Link
                  href={item.href}
                  className={`bt-link ${item.key === "Home" && pathname === "/" ? "is-current" : ""}`}
                  onClick={item.key === "Home" ? goHome : closeNow}
                >
                  {item.key}
                  {item.badge && <em className="bt-badge">{item.badge}</em>}
                  {item.menu && <i className="bt-chevron">▾</i>}
                </Link>
                {item.menu && openKey === item.key && (
                  <div className="bt-panel" role="menu">
                    <Panel menu={menus[item.key]} onNavigate={closeNow} />
                  </div>
                )}
              </NavItem>
            ))}

            {/* Always visible, on every page */}
            <NavItem id="anim" openKey={openKey} hasMenu={false} className="bt-item-anim">
              <Link href="/pc-assembly" className="bt-link bt-anim" onClick={closeNow}>
                <span className="bt-anim-dot">▶</span>
                Build Animation
              </Link>
            </NavItem>
          </div>
        </nav>
      </header>
    </>
  );
}
import Link from "next/link";
import { categories, products } from "@/data/products";

/* Category tiles used on the home page AND the shop page.
   The picture is the top-rated product of that category.
   To use a different picture, put a product id here, e.g. { Monitors: 141 }. */
const CATEGORY_IMAGE_OVERRIDES = {};

const CARDS = categories.map(([name, icon]) => {
  const list = products.filter((p) => p.category === name);
  const cover =
    products.find((p) => p.id === CATEGORY_IMAGE_OVERRIDES[name]) ||
    [...list].sort((a, b) => b.rating - a.rating)[0];
  return { name, icon, count: list.length, image: cover?.image || "" };
});

/* active   — name of the category being shown (it gets highlighted)
   onSelect — optional; when given, tiles filter in place instead of navigating */
export default function CategoryTiles({ active = "", onSelect }) {
  return (
    <div className="cat-grid">
      {CARDS.map((card) => {
        const isActive = active === card.name;
        const className = `cat-card ${isActive ? "is-active" : ""}`;
        const content = (
          <>
            <img src={card.image} alt="" loading="lazy" />
            <span className="cat-shade" />
            <span className="cat-icon">{card.icon}</span>
            <span className="cat-count">
              {card.count} {card.count === 1 ? "item" : "items"}
            </span>
            <span className="cat-body">
              <b>{card.name}</b>
              <small>
                {isActive ? (
                  "Showing now ✓"
                ) : (
                  <>
                    Shop now <i>→</i>
                  </>
                )}
              </small>
            </span>
          </>
        );

        return onSelect ? (
          <button key={card.name} type="button" className={className} onClick={() => onSelect(card.name)} aria-pressed={isActive}>
            {content}
          </button>
        ) : (
          <Link key={card.name} href={`/shop?category=${encodeURIComponent(card.name)}`} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
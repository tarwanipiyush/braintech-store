"use client";

import FeaturedProducts from "./components/FeaturedProducts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/data/products";

export default function Home() {
  const router = useRouter();

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // The product catalog lives on /shop, so every product-related button
  // on the home page navigates there with the matching filter.
  function goToShop(params = {}) {
    const query = new URLSearchParams(params).toString();
    router.push(query ? `/shop?${query}` : "/shop");
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
              onClick={() => goToShop()}
            >
              Explore products <span>↗</span>
            </button>

            <button
              type="button"
              className="button-ghost"
              onClick={() => scrollToSection("pc-builds")}
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
            <section className="assembly-banner" id="build-animation">
        <div className="assembly-banner-glow" />
        <div className="assembly-banner-copy">
          <span className="section-kicker">LIVE 3D BUILD LAB</span>
          <h2>
            Watch a gaming PC be built, <em>part by part.</em>
          </h2>
          <p>
            See the power supply, motherboard, processor, cooler, memory, SSD
            and graphics card go into a see-through cabinet you can rotate
            and look inside — then watch it power on.
          </p>
          <Link href="/pc-assembly" className="assembly-banner-button">
            <span className="assembly-banner-play">▶</span>
            Watch the build animation
          </Link>
        </div>

        <ol className="assembly-banner-steps" aria-label="Build steps">
          {[
            "Cabinet",
            "Power supply",
            "Motherboard",
            "Processor",
            "CPU cooler",
            "Memory",
            "SSD",
            "Graphics card",
            "Fans & cables",
            "Power on",
          ].map((name, i) => (
            <li key={name}>
              <span>{i + 1}</span>
              {name}
            </li>
          ))}
        </ol>
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
            onClick={() => goToShop()}
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
              onClick={() => goToShop({ category: name })}
            >
              <span className="tile-icon">{icon}</span>
              <span className="tile-name">{name}</span>
              <span className="tile-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <FeaturedProducts
        title="Best Sellers"
        subtitle="Popular components and hardware picks for your next build."
        tags={["Bestseller"]}
        limit={4}
      />

      <FeaturedProducts
        title="Special Offers"
        subtitle="Discover selected deals and popular gaming hardware."
        tags={["Monitor deal", "Hot pick"]}
        limit={4}
      />

      <section id="pc-builds" className="build-banner">
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
            onClick={() => goToShop({ category: "Components" })}
          >
            Explore components ↗
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
    </div>
  );
}

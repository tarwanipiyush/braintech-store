
"use client";

import FeaturedProducts from "./components/FeaturedProducts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CategoryTiles from "./components/CategoryTiles";
import "./globals.css";
import HomepageBanners from "./components/HomepageBanners";

export default function Home() {
  const router = useRouter();

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function goToShop(params = {}) {
    const query = new URLSearchParams(params).toString();
    router.push(query ? `/shop?${query}` : "/shop");
  }

  return (
    <div className="storefront">
    {/* DYNAMIC HOSTINGER BANNERS */}
<HomepageBanners />

{/* HERO */}
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

      <HomepageBanners page="homepage" placement="below_hero" />

      {/* TRUST BENEFITS */}
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

      {/* SMALL PROMOTIONAL CARDS */}
      <section className="promo-grid" aria-label="Explore BrainTech">
        <Link
          href="/shop?category=Gaming%20Gears"
          className="promo-card"
        >
          <div>
            <span className="promo-kicker">LEVEL UP</span>
            <h3>Upgrade your gaming setup</h3>
            <p>
              Explore gaming gear for a more complete setup.
            </p>
          </div>
          <span className="promo-link">Explore gaming gear ↗</span>
        </Link>

        <Link
          href="/build-it-yourself"
          className="promo-card"
        >
          <div>
            <span className="promo-kicker">BUILD YOUR WAY</span>
            <h3>Your PC. Your choices.</h3>
            <p>
              Start planning a build around your needs and preferences.
            </p>
          </div>
          <span className="promo-link">Start your build ↗</span>
        </Link>

        <Link
          href="/shop?category=Components"
          className="promo-card"
        >
          <div>
            <span className="promo-kicker">MADE TO PERFORM</span>
            <h3>Find your next upgrade</h3>
            <p>
              Explore hardware for gaming, work and content creation.
            </p>
          </div>
          <span className="promo-link">Browse components ↗</span>
        </Link>
      </section>

      {/* PC ASSEMBLY ANIMATION — BEFORE CATEGORIES */}
      <section className="assembly-banner" id="build-animation">
        <div className="assembly-banner-glow" />

        <div className="assembly-banner-copy">
          <span className="section-kicker">LIVE 3D BUILD LAB</span>

          <h2>
            Watch a gaming PC be built, <em>part by part.</em>
          </h2>

          <p>
            See the power supply, motherboard, processor, cooler, memory,
            SSD and graphics card go into a see-through cabinet you can
            rotate and look inside — then watch it power on.
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

      {/* CATEGORIES */}
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

              <CategoryTiles />
      </section>

      <HomepageBanners page="homepage" placement="between_sections" />

      {/* BUILD IT YOURSELF — AFTER CATEGORIES */}
      
<section className="byo-promo-banner">
  <div className="byo-promo-content">
    <span className="section-kicker">YOUR DREAM BUILD STARTS HERE</span>
    <h2>
      Build it yourself.
      <br />
      <span>Make it yours.</span>
    </h2>
    <p>
      Choose your components, plan your setup, and create a PC
      tailored to your gaming, work, or creative needs.
    </p>
    <Link href="/build-it-yourself" className="promo-outline-button">
      Start building your PC <span aria-hidden="true">↗</span>
    </Link>
  </div>

  <div className="byo-promo-art" aria-hidden="true">
    <div className="byo-art-glow" />
    <div className="byo-art-ring ring-one" />
    <div className="byo-art-ring ring-two" />
    <div className="byo-art-chip">
      <span>BT</span>
      <small>PERFORMANCE</small>
    </div>
    <div className="byo-art-label label-one">CPU</div>
    <div className="byo-art-label label-two">GPU</div>
    <div className="byo-art-label label-three">32GB RAM</div>
  </div>
</section>


      {/* BEST SELLERS */}
      <FeaturedProducts
        title="Best Sellers"
        subtitle="Popular components and hardware picks for your next build."
        tags={["Bestseller"]}
        limit={4}
      />

      {/* SPECIAL OFFERS */}
      <FeaturedProducts
        title="Special Offers"
        subtitle="Discover selected deals and popular gaming hardware."
        tags={["Monitor deal", "Hot pick"]}
        limit={4}
      />

      {/* LARGE PROMOTIONAL BANNER — REPLACES OLD FINAL BANNER */}
      <section className="main-promo-banner">
        <div className="main-promo-glow" />

        <div className="main-promo-copy">
          <span className="main-promo-kicker">
            PERFORMANCE MEETS PRECISION
          </span>

          <h2>
            Power up
            <br />
            <span>your next level.</span>
          </h2>

          <p>
            From powerful processors to graphics cards and gaming
            essentials, find the hardware to bring your next big idea
            to life.
          </p>

          <div className="main-promo-actions">
            <Link href="/shop" className="main-promo-button">
              Explore all products <span>↗</span>
            </Link>

            <Link
              href="/shop?category=Components"
              className="main-promo-secondary"
            >
              Discover components →
            </Link>
          </div>
        </div>

        <div className="main-promo-visual" aria-hidden="true">
          <div className="main-promo-ring ring-one" />
          <div className="main-promo-ring ring-two" />

          <div className="main-promo-device">
            <div className="main-promo-device-top" />

            <div className="main-promo-device-glass">
              <div className="main-promo-fan fan-a" />
              <div className="main-promo-fan fan-b" />
              <div className="main-promo-fan fan-c" />
              <div className="main-promo-device-gpu" />
            </div>

            <div className="main-promo-device-front">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="main-promo-floating">
            <strong>BUILT FOR PERFORMANCE</strong>
            <span>Gaming · Creation · Productivity</span>
          </div>
        </div>
         </section>

      <HomepageBanners page="homepage" placement="before_footer" />

    </div>
  );
}
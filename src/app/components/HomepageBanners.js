
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomepageBanners({
  page = "homepage",
  placement = "top",
}) {  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchBanners() {
      try {
       const response = await fetch(
  `/api/store/banners?page=${encodeURIComponent(page)}`,
  {
    cache: "no-store",
  }
);

        const data = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.banners)) {
          throw new Error("Could not load homepage banners.");
        }

        if (!cancelled) {
const matchingBanners = data.banners.filter(
  (banner) => (banner.placement || "top") === placement
);

setBanners(matchingBanners);
setActiveIndex(0);        }
      } catch (error) {
        console.error("Homepage banners:", error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchBanners();

    return () => {
      cancelled = true;
    };
  }, [page, placement]);
  useEffect(() => {
    if (banners.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [banners.length]);

  function previousBanner() {
    setActiveIndex((current) =>
      current === 0 ? banners.length - 1 : current - 1
    );
  }

  function nextBanner() {
    setActiveIndex((current) => (current + 1) % banners.length);
  }

  if (!loaded || banners.length === 0) return null;

  const banner = banners[activeIndex];

  return (
    <section className="homepage-banners" aria-label="Featured promotions">
      <div className="homepage-banner-track">
        {banner.image && (
          <img
         key={`banner-image-${banner.id}-${activeIndex}`}
            className="homepage-banner-image"
            src={banner.image}
            alt=""
          />
        )}

        <div className="homepage-banner-shade" />

       <div className="homepage-banner-content" key={`banner-content-${banner.id}-${activeIndex}`}>
          <span className="homepage-banner-kicker">
            BRAINTECH STORE
          </span>

          <h2>{banner.title}</h2>

          {banner.subtitle && <p>{banner.subtitle}</p>}

          {banner.buttonText && (
            <Link
              href={banner.buttonLink || "/shop"}
              className="homepage-banner-button"
            >
              {banner.buttonText}
              <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              className="homepage-banner-arrow banner-arrow-left"
              onClick={previousBanner}
              aria-label="Previous banner"
            >
              ‹
            </button>

            <button
              type="button"
              className="homepage-banner-arrow banner-arrow-right"
              onClick={nextBanner}
              aria-label="Next banner"
            >
              ›
            </button>

            <div className="homepage-banner-dots">
              {banners.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`homepage-banner-dot ${
                    index === activeIndex ? "is-active" : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show banner ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}

        <div className="homepage-banner-counter">
          {String(activeIndex + 1).padStart(2, "0")}
          <span> / </span>
          {String(banners.length).padStart(2, "0")}
        </div>
      </div>

      <style jsx>{`
        .homepage-banners {
          width: 100%;
          padding: 24px 5% 12px;
          background: #080b12;
        }

        .homepage-banner-track {
          position: relative;
          width: 100%;
          min-height: 390px;
          overflow: hidden;
          isolation: isolate;
          display: flex;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 80% 45%,
              rgba(92, 52, 220, 0.35),
              transparent 42%
            ),
            linear-gradient(115deg, #101522, #080b12);
        }

        .homepage-banner-image {
          position: absolute;
          inset: 0;
          z-index: -2;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          animation: bannerImageIn 0.65s ease both;
        }

        .homepage-banner-shade {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(
            90deg,
            rgba(5, 8, 17, 0.96) 0%,
            rgba(5, 8, 17, 0.83) 38%,
            rgba(5, 8, 17, 0.35) 72%,
            rgba(5, 8, 17, 0.12) 100%
          );
        }

        .homepage-banner-content {
          width: min(680px, 75%);
          padding: 65px 8%;
          color: #fff;
          animation: bannerContentIn 0.55s ease both;
        }

        .homepage-banner-kicker {
          display: inline-block;
          margin-bottom: 18px;
          color: #b69aff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .homepage-banner-content h2 {
          max-width: 650px;
          margin: 0;
          color: #fff;
          font-size: clamp(34px, 5vw, 62px);
          font-weight: 850;
          line-height: 1.08;
          letter-spacing: -2px;
        }

        .homepage-banner-content p {
          max-width: 520px;
          margin: 20px 0 26px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 15px;
          line-height: 1.8;
        }

        .homepage-banner-button {
          display: inline-flex;
          align-items: center;
          gap: 22px;
          padding: 14px 21px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: linear-gradient(110deg, #8154ef, #6135ce);
          color: #fff;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .homepage-banner-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(105, 65, 220, 0.35);
        }

        .homepage-banner-arrow {
          position: absolute;
          top: 50%;
          z-index: 2;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          transform: translateY(-50%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          background: rgba(8, 10, 18, 0.65);
          color: #fff;
          font-size: 28px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .homepage-banner-arrow:hover {
          background: #7549df;
        }

        .banner-arrow-left {
          left: 18px;
        }

        .banner-arrow-right {
          right: 18px;
        }

        .homepage-banner-dots {
          position: absolute;
          bottom: 23px;
          left: 8%;
          display: flex;
          gap: 9px;
        }

        .homepage-banner-dot {
          width: 8px;
          height: 8px;
          padding: 0;
          border: 0;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: width 0.2s ease, background 0.2s ease;
        }

        .homepage-banner-dot.is-active {
          width: 28px;
          background: #a98aff;
        }

        .homepage-banner-counter {
          position: absolute;
          right: 28px;
          bottom: 23px;
          color: #fff;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 2px;
        }

        .homepage-banner-counter span {
          color: rgba(255, 255, 255, 0.4);
        }

        @keyframes bannerImageIn {
          from {
            opacity: 0.55;
            transform: scale(1.025);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bannerContentIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 700px) {
          .homepage-banners {
            padding: 14px 4% 8px;
          }

          .homepage-banner-track {
            min-height: 340px;
            border-radius: 13px;
          }

          .homepage-banner-shade {
            background: linear-gradient(
              90deg,
              rgba(5, 8, 17, 0.93),
              rgba(5, 8, 17, 0.58)
            );
          }

          .homepage-banner-content {
            width: 100%;
            padding: 55px 9%;
          }

          .homepage-banner-content h2 {
            font-size: clamp(30px, 9vw, 43px);
            letter-spacing: -1px;
          }

          .homepage-banner-content p {
            font-size: 13px;
            line-height: 1.65;
          }

          .homepage-banner-arrow {
            top: auto;
            bottom: 13px;
            width: 34px;
            height: 34px;
            font-size: 23px;
            transform: none;
          }

          .banner-arrow-left {
            right: 58px;
            left: auto;
          }

          .banner-arrow-right {
            right: 15px;
          }

          .homepage-banner-dots {
            bottom: 25px;
            left: 9%;
          }

          .homepage-banner-counter {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .homepage-banner-image,
          .homepage-banner-content {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

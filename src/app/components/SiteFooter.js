
const informationLinks = [
  { label: "About Us", href: "/pages/about-us" },
  { label: "Contact Us", href: "/pages/contact" },
  { label: "Shipping & Delivery Policy", href: "/pages/shipping-policy" },
  { label: "Return, Refund & Cancellation Policy", href: "/pages/refund-policy" },
  { label: "Warranty Policy", href: "/pages/warranty-policy" },
  { label: "Terms and Conditions", href: "/pages/terms-conditions" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Frequently Asked Questions (FAQ)", href: "/pages/faq" },
];

const quickLinks = [
  { label: "Razer", href: "/collections/razer" },
  { label: "Logitech", href: "/collections/logitech" },
  { label: "HyperX", href: "/collections/hyperx" },
];

const pcBuilds = [
  { label: "Gaming & Streaming PC", href: "/pages/gaming-streaming-pc" },
  { label: "Video Editing PC", href: "/pages/video-editing-pc" },
  { label: "3D Generalist PC", href: "/pages/3d-generalist-pc" },
  { label: "Architectural PC", href: "/pages/architectural-pc" },
  { label: "3D Modelling PC", href: "/pages/3d-modelling-pc" },
  { label: "VFX Animation PC", href: "/pages/vfx-animation-pc" },
  { label: "Compositing PC", href: "/pages/compositing-pc" },
];

const componentBrands = [
  { label: "AMD", href: "/collections/amd" },
  { label: "Cooler Master", href: "/collections/cooler-master" },
  { label: "Corsair", href: "/collections/corsair" },
  { label: "Gigabyte", href: "/collections/gigabyte" },
  { label: "Intel", href: "/collections/intel" },
  { label: "Lian Li", href: "/collections/lian-li" },
];

function FooterLinkList({ title, links }) {
  return (
    <div className="site-footer-column">
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <section className="site-footer-contact">
          <a
            className="site-footer-logo"
            href="/"
            aria-label="Brain Tech shopping homepage"
          >
            <span className="site-footer-logo-mark">B</span>
            <span>
              Brain <strong>Tech</strong>
            </span>
          </a>

          <p className="site-footer-tagline">
            Your destination for gaming gear, PC components and custom-built PCs.
          </p>

          <h3>Got Question? Contact Us</h3>

          <a className="site-footer-highlight" href="tel:9323744070">
            +91 93237 44070
          </a>

          <p className="site-footer-address">
            Shop No. 209/213, Ground Floor, Regency Landmark, Link Road,
            opposite Jovial Decor and Woodland Complex, Ulhasnagar,
            Maharashtra 421002 / 421003, India.
          </p>

          <a className="site-footer-email" href="mailto:ptarwaniii@gmail.com">
            ptarwaniii@gmail.com
          </a>
        </section>

        <FooterLinkList title="Information" links={informationLinks} />
        <FooterLinkList title="Quick Links" links={quickLinks} />
        <FooterLinkList title="PC Builds" links={pcBuilds} />
        <FooterLinkList title="Component Brands" links={componentBrands} />
      </div>

      <div className="site-footer-bottom">
        <p>© {new Date().getFullYear()} Brain Tech. All rights reserved.</p>
        <p>Built for gamers. Designed for performance.</p>
      </div>
    </footer>
  );
}
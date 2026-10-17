
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/data/products";

const PHONE = "+91 93237 44070";
const EMAIL = "ptarwaniii@gmail.com";

const pages = {
  "about-us": {
    title: "About Brain Tech",
    text: "Brain Tech is your destination for gaming hardware, computer components, accessories and custom PC solutions.",
    sections: [
      ["Who We Are", "We help gamers, creators, professionals and businesses explore computer hardware suited to their needs. Our catalogue covers products for gaming, productivity and creative work."],
      ["Our Products", "Discover gaming peripherals, keyboards, mice, headsets, computer components, storage devices, cooling products and PC configurations for different workloads."],
      ["Custom PC Solutions", "Whether you need a gaming PC, streaming setup, video editing workstation or computer for 3D applications, consider your software requirements, budget and future upgrade plans before selecting components."],
      ["Our Commitment", "We aim to provide useful product information and responsive customer support. Product availability, prices, specifications and warranty coverage should be confirmed before purchase."],
      ["Contact Us", `Phone: ${PHONE} | Email: ${EMAIL}`],
    ],
  },

  contact: {
    title: "Contact Us",
    text: "Have questions about a product, order or custom PC? Get in touch with Brain Tech.",
    sections: [
      ["Phone Support", `Call ${PHONE} for product enquiries, order assistance and general support.`],
      ["Email Support", `Write to ${EMAIL}. Include your order number and product name for order-related questions.`],
      ["Store Address", "Shop No. 209/213, Ground Floor, Regency Landmark, Link Road, opposite Jovial Decor and Woodland Complex, Ulhasnagar, Maharashtra 421002 / 421003, India."],
      ["Product Enquiries", "Tell us your intended use, approximate budget, preferred components and software requirements when asking about a PC build."],
      ["After-Sales Support", "For damaged, defective, incorrect or delayed orders, contact us with your order details and any relevant photographs or videos."],
    ],
  },

  "shipping-policy": {
    title: "Shipping & Delivery Policy",
    text: "This policy explains the general considerations for processing, dispatching and delivering orders placed with Brain Tech.",
    sections: [
      ["1. Shipping Availability", "Delivery availability depends on your destination PIN code, courier coverage, product dimensions and any applicable shipping restrictions. Confirm serviceability if you are unsure."],
      ["2. Shipping Charges", "Applicable shipping or handling charges should be confirmed before the order is placed. Charges can vary depending on the destination, product and delivery arrangement."],
      ["3. Order Processing", "Orders are processed after the relevant order and payment details have been reviewed. Processing times may vary depending on product availability, holidays and order volume. Custom PC builds may require additional time for assembly and testing."],
      ["4. Delivery Estimates", "Delivery estimates depend on the destination and courier service and are not guaranteed dates. Weather, public holidays, transport disruptions and courier delays may affect delivery."],
      ["5. Tracking", "Where tracking is available, shipment information may be shared using the contact details provided with your order."],
      ["6. Accurate Address", "Customers should provide a complete delivery address, correct PIN code and reachable phone number. Incorrect details or unsuccessful delivery attempts may cause delays."],
      ["7. Damaged or Missing Items", "If an item arrives damaged, is missing or is incorrect, contact us promptly with your order number and supporting photographs or video. Keep the packaging and invoice while the issue is reviewed."],
      ["8. Shipping Support", `Phone: ${PHONE} | Email: ${EMAIL}`],
    ],
  },

  "refund-policy": {
    title: "Return, Refund & Cancellation Policy",
    text: "Brain Tech reviews return, replacement, refund and cancellation requests based on the product, order status and circumstances of the request.",
    sections: [
      ["1. Damaged, Defective or Incorrect Products", "If you receive a damaged, defective or incorrect product, contact us with your order number, invoice and a clear description of the issue. Photographs or video may be requested."],
      ["2. Return Requests", "Return eligibility depends on the product, its condition, the reason for the request and the applicable terms. Contact us before sending an item back."],
      ["3. Product Condition", "Where applicable, retain the original packaging, accessories, manuals, serial number labels and invoice. Products that have been used, installed, modified or damaged may be subject to different eligibility conditions."],
      ["4. Custom-Built Products", "Custom-built or specially configured products may have specific return and cancellation conditions. Confirm eligibility with us before placing an order."],
      ["5. Replacement Requests", "An approved replacement may require the returned item to be received and inspected first. Replacement availability depends on stock and the assessment outcome."],
      ["6. Order Cancellation", "Contact us as soon as possible to request cancellation. Whether an order can be cancelled depends on its processing, assembly and dispatch status."],
      ["7. Refund Processing", "Approved refunds are processed according to the applicable terms and payment arrangements. The time required for funds to appear depends on the payment provider and banking institution."],
      ["8. Return Shipping", "Responsibility for return shipping depends on the reason for the return and the agreed resolution. Obtain instructions before arranging a return shipment."],
      ["9. Contact Us", `Phone: ${PHONE} | Email: ${EMAIL}`],
    ],
  },

  "warranty-policy": {
    title: "Warranty Policy",
    text: "Warranty coverage depends on the product, manufacturer and any applicable custom-build or service terms.",
    sections: [
      ["1. Manufacturer Warranty", "Computer components and peripherals may be covered by their respective manufacturer's warranty. Duration, eligibility, exclusions and claim procedures vary by product and brand."],
      ["2. Custom PC Warranty", "A custom PC may contain components with separate manufacturer warranties. Assembly or service coverage, where applicable, may be governed by separate terms."],
      ["3. Warranty Documentation", "Keep your purchase invoice and warranty documentation. Check the terms supplied with the product to understand coverage and claim requirements."],
      ["4. Exclusions", "Depending on the applicable terms, exclusions may include physical damage, liquid damage, misuse, improper installation, unauthorised repair, modifications or tampering."],
      ["5. Raising a Claim", "Contact us with your order number, invoice, product model, serial number and description of the fault. Photographs or videos may be requested for an initial assessment."],
      ["6. Warranty Assistance", `Phone: ${PHONE} | Email: ${EMAIL}`],
    ],
  },

  "terms-conditions": {
    title: "Terms and Conditions",
    text: "These terms describe the general conditions for browsing the Brain Tech website and purchasing products.",
    sections: [
      ["1. Website Use", "Users should use the website lawfully and must not attempt unauthorised access, disrupt its operation or submit misleading information."],
      ["2. Product Information", "We aim to provide useful product descriptions and images. Packaging, included accessories and specifications may vary by manufacturer or product revision. Confirm important details before ordering."],
      ["3. Pricing and Availability", "Prices, promotions and stock availability may change. If a material listing error or stock issue affects an order, we may need to contact you to discuss the available options."],
      ["4. Orders and Payments", "Orders are subject to availability, payment verification and confirmation by the store. Customers should provide accurate billing, delivery and contact information."],
      ["5. Custom PC Builds", "Confirm the final component list, compatibility, price, availability, estimated dispatch time and warranty conditions before approving a custom configuration."],
      ["6. Shipping and Delivery", "Delivery estimates may be affected by courier operations, public holidays, weather and circumstances outside the store's control. Applicable shipping conditions also apply."],
      ["7. Returns and Warranty", "Return, cancellation, refund and warranty requests are handled according to the relevant policy and product terms."],
      ["8. Third-Party Services", "Payment providers, couriers and manufacturers may provide services associated with a purchase. Their own terms may apply to those services."],
      ["9. Updates", "These terms may be updated when our services or operational requirements change. Review the current terms before placing an order."],
      ["10. Contact", `Phone: ${PHONE} | Email: ${EMAIL}`],
    ],
  },

  "privacy-policy": {
    title: "Privacy Policy",
    text: "Brain Tech aims to handle personal information responsibly when customers browse the website, place orders or contact customer support.",
    sections: [
      ["1. Information We May Collect", "Information may include your name, phone number, email address, billing and delivery addresses, order details and messages sent to customer support. Technical information about your browser or device may also be processed."],
      ["2. How Information Is Used", "Information may be used to process orders, arrange delivery, respond to enquiries, provide customer support, manage return and warranty requests, maintain website security and meet applicable legal obligations."],
      ["3. Payments", "Payments may be processed through third-party payment providers and subject to their security and privacy practices. Never send passwords or one-time passwords through ordinary email or customer support messages."],
      ["4. Sharing Information", "Information may be shared with service providers when necessary to process payments, deliver orders, maintain the website, provide support or meet legal obligations."],
      ["5. Cookies and Technical Data", "The website or its service providers may use cookies or similar technologies for functionality, security and usage analysis. Available controls depend on the technologies used and your browser settings."],
      ["6. Security and Retention", "Reasonable measures should be used to protect personal information. Information may be retained as necessary for order processing, customer support, record keeping, dispute resolution and legal obligations."],
      ["7. Your Choices", "You may contact us with questions about personal information associated with your enquiries or orders. Requests may need verification and may be subject to applicable requirements."],
      ["8. Policy Updates", "This policy may be updated as website practices or legal requirements change. Review the latest version periodically."],
      ["9. Privacy Enquiries", `Email: ${EMAIL} | Phone: ${PHONE}`],
    ],
  },

  faq: {
    title: "Frequently Asked Questions",
    text: "Find answers to common questions about products, PC builds, orders and support.",
    sections: [
      ["How can I contact Brain Tech?", `Call ${PHONE} or email ${EMAIL}.`],
      ["How do I check product availability?", "Contact us to confirm current stock, specifications and expected availability before placing an order."],
      ["Can I enquire about a custom PC?", "Yes. Tell us your budget, intended applications, performance requirements and preferred components."],
      ["How can I check compatibility?", "Review the specifications of each component and confirm compatibility before purchasing or approving a custom build."],
      ["How do I check my order status?", "Contact us with your order number and contact details. Use the shipment tracking information if it has been provided."],
      ["What if my item arrives damaged?", "Contact us promptly with your order number, invoice and photographs or video of the product and packaging."],
      ["How do I request a refund?", "Contact us before sending the product back. Eligibility depends on the item, its condition, order status and applicable policy."],
      ["Are products covered by warranty?", "Warranty coverage varies by product and manufacturer. Keep your invoice and check the documentation supplied with the product."],
      ["How do I get delivery help?", "Contact us with your order number and delivery details. Delivery availability and estimates depend on your location and courier service."],
      ["Where can I find PC builds?", "Use the PC Builds links in the footer to browse available build categories and listed products."],
    ],
  },

  "gaming-streaming-pc": {
    title: "Gaming & Streaming PC",
    text: "Explore PC builds intended for gaming, streaming and competitive play.",
    productIds: [149, 150, 151, 152, 153],
  },
  "simulator-pc": {
    title: "Streaming & Simulator PC",
    text: "Explore PC options for simulator gaming and streaming workloads.",
    productIds: [149, 150, 151, 152, 153],
  },
  "music-production-pc": {
    title: "Music Production PC",
    text: "Explore computer configurations for music production and audio workflows.",
  },
  "video-editing-pc": {
    title: "Video Editing PC",
    text: "Explore computer options for video editing and creative workloads.",
    productIds: [154, 155, 156, 157, 158],
  },
  "3d-generalist-pc": {
    title: "3D Generalist PC",
    text: "Explore hardware options for 3D modelling, rendering and creative workflows.",
    productIds: [159, 160, 161, 162, 163],
  },
  "game-development-pc": {
    title: "Game Development PC",
    text: "Explore hardware options for game development.",
  },
  "architectural-pc": {
    title: "Architectural PC",
    text: "Explore workstation options for architectural design and visualization.",
    productIds: [164, 165, 166, 167, 168],
  },
  "3d-modelling-pc": {
    title: "3D Modelling PC",
    text: "Explore hardware options for 3D modelling and creative projects.",
    productIds: [169, 170, 171, 172, 173],
  },
  "vfx-animation-pc": {
    title: "VFX Animation PC",
    text: "Explore hardware options for visual effects and animation.",
    productIds: [174, 175, 176, 177, 178],
  },
  "compositing-pc": {
    title: "Compositing PC",
    text: "Explore computer options for compositing and post-production.",
    productIds: [179, 180, 181, 182, 183],
  },
  "graphic-designing-pc": {
    title: "Graphic Designing PC",
    text: "Explore computer options for graphic design.",
  },
  "corporate-pc": {
    title: "Corporate Use PC",
    text: "Explore computer options for office and business use.",
  },
};

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function renderContactText(text, index) {
  if (text.includes(PHONE)) {
    const parts = text.split(PHONE);
    return (
      <p key={index}>
        {parts[0]}
        <a href="tel:+919323744070">{PHONE}</a>
        {parts[1]}
      </p>
    );
  }

  if (text.includes(EMAIL)) {
    const parts = text.split(EMAIL);
    return (
      <p key={index}>
        {parts[0]}
        <a href="mailto:ptarwaniii@gmail.com">{EMAIL}</a>
        {parts[1]}
      </p>
    );
  }

  return <p key={index}>{text}</p>;
}

export default async function InformationPage({ params }) {
  const { slug } = await params;
  const page = pages[slug];

  if (!page) {
    notFound();
  }

  const pageProducts = page.productIds
    ? page.productIds
        .map((id) => products.find((product) => product.id === id))
        .filter(Boolean)
    : [];

  return (
    <main className="internal-page">
      <div className="internal-page-inner">
        <nav className="internal-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{page.title}</span>
        </nav>

        <span className="internal-kicker">BRAIN TECH</span>
        <h1>{page.title}</h1>
        <p className="internal-intro">{page.text}</p>

        {page.sections?.map(([heading, content]) => (
          <section className="internal-content-section" key={heading}>
            <h2>{heading}</h2>
            {renderContactText(content, heading)}
          </section>
        ))}

        {pageProducts.length > 0 && (
          <>
            <h2 className="internal-section-title">
              Explore {page.title} Builds
            </h2>

            <p className="internal-intro">
              {pageProducts.length} products available in this collection.
            </p>

            <div className="internal-product-grid">
              {pageProducts.map((product) => (
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

                  {product.oldPrice > product.price && (
                    <p>
                      <s>{formatPrice(product.oldPrice)}</s>
                    </p>
                  )}

                  <span>View product →</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {!page.sections && pageProducts.length === 0 && (
          <section className="internal-content-section">
            <p>
              Products for this category have not been added yet. Contact us
              to enquire about availability.
            </p>
          </section>
        )}

        <div className="internal-page-actions">
          <Link className="internal-shop-button" href="/">
            Explore Products
          </Link>
          <Link className="internal-secondary-button" href="/">
            ← Back to Store
          </Link>
        </div>
      </div>
    </main>
  );
}
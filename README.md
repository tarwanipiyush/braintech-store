# BrainTech Store UI refresh

A Next.js storefront UI with interactive category filtering, a 48-item sample catalog, product detail pages, related products, quick view, wishlist filtering, search, sorting, and cart integration.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually http://localhost:3000).

## Important catalog note

The 48 products in `src/data/products.js` are starter/demo listings. A few names are based on publicly visible BrainTech PC examples, but the local list is not a complete export and is not synced to the official live inventory. Product prices, images, availability, specifications, ratings, discounts, and warranty terms must be verified before any real sales.

To load the entire official catalog, import the authorized product export (for example a CSV from the store admin) into `src/data/products.js` or connect the store's product API/backend. The UI cannot safely infer every product from category names alone.

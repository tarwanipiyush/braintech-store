
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { products, categories } from "../src/data/products.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(scriptDirectory, "braintech-catalog.json");

const catalog = {
  exportedAt: new Date().toISOString(),
  source: "src/data/products.js",
  categories: categories.map(([name], index) => ({
    name,
    sortOrder: index + 1,
  })),
  products: products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice ?? null,
    image: product.image ?? null,
    tag: product.tag ?? null,
    rating: product.rating ?? null,
    description: product.description ?? null,
    features: product.features ?? [],
  })),
};

await writeFile(outputPath, JSON.stringify(catalog, null, 2), "utf8");

console.log(`Exported ${catalog.products.length} products.`);
console.log(`Exported ${catalog.categories.length} categories.`);
console.log(`File created: ${outputPath}`);

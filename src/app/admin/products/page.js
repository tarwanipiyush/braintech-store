
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  products as seedProducts,
  categories as storeCategories,
} from "@/data/products";

const STORAGE_KEY = "braintech-admin-products-v1";
const LOW_STOCK_LIMIT = 5;

const TABS = [
  ["general", "General"],
  ["organisation", "Organisation"],
  ["pricing", "Pricing"],
  ["inventory", "Inventory"],
  ["specifications", "Specifications"],
  ["variants", "Variants"],
  ["shipping", "Shipping"],
  ["seo", "SEO"],
];

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getDefaultStock = (id) => 5 + (Number(id) % 36);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function normalizeProduct(product, index = 0) {
  const id = Number(product.id) || Date.now() + index;
  const name = product.name || "";

  return {
    id,
    name,
    category: product.category || "Other",
    price: Number(product.price) || 0,
    oldPrice: Number(product.oldPrice) || 0,
    image: product.image || "",
    tag: product.tag || "",
    rating: Number(product.rating) || 0,
    description: product.description || "",
    vendor: product.vendor || "",
    productType: product.productType || "",
    tags: Array.isArray(product.tags)
      ? product.tags
      : typeof product.tags === "string"
        ? product.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    handle: product.handle || slugify(name),
    sku: product.sku || `BT-${id}`,
    barcode: product.barcode || "",
    cost: Number(product.cost) || 0,
    stock:
      product.stock === undefined || product.stock === null
        ? getDefaultStock(id)
        : Math.max(0, Number(product.stock) || 0),
    status: ["Active", "Draft", "Archived"].includes(product.status)
      ? product.status
      : "Active",
    published:
      product.published === undefined
        ? !["Draft", "Archived"].includes(product.status)
        : Boolean(product.published),
    taxable: product.taxable !== false,
    requiresShipping: product.requiresShipping !== false,
    weight: Number(product.weight) || 0,
    weightUnit: product.weightUnit || "kg",
    seoTitle: product.seoTitle || name,
    seoDescription: product.seoDescription || product.description || "",
    options: Array.isArray(product.options) ? product.options : [],
    specifications: Array.isArray(product.specifications)
  ? product.specifications
  : [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || "",
  };
}

function makeEmptyProduct(category) {
  return {
    id: "",
    name: "",
    category: category || "Processors",
    price: "",
    oldPrice: "",
    image: "",
    tag: "",
    rating: 0,
    description: "",
    vendor: "",
    productType: "",
    tags: [],
    handle: "",
    sku: "",
    barcode: "",
    cost: "",
    stock: 0,
    status: "Draft",
    published: false,
    taxable: true,
    requiresShipping: true,
    weight: "",
    weightUnit: "kg",
    seoTitle: "",
    seoDescription: "",
    options: [],
    variants: [],
    createdAt: "",
    updatedAt: "",
  };
}

function parseJsonField(value, label) {
  const text = String(value || "").trim();

  if (!text) return [];

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`${label} must contain valid JSON.`);
  }

  if (!Array.isArray(result)) {
    throw new Error(`${label} must be a JSON array.`);
  }

  return result;
}

function Field({ label, hint, full = false, children }) {
  return (
    <label
      className={`products-admin-field${full ? " products-admin-field-full" : ""}`}
    >
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="products-admin-form-section">
      <div className="products-admin-section-heading">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

/*
 * Compress uploaded images before storing them in browser storage.
 * This is a temporary frontend implementation until the Hostinger
 * backend and permanent image storage are connected.
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      reject(new Error("Please upload a JPG, PNG, or WebP image."));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 15 MB."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read the image."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(new Error("This image could not be opened."));

      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Image processing is unavailable."));
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        try {
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        } catch {
          reject(new Error("Could not process this image."));
        }
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}


const ADMIN_PRODUCTS_API = "/api/admin/products";

function getAdminToken() {
  return localStorage.getItem("braintech-admin-token") || "";
}


function getCategoryId(category) {
  const categoryMap = {
    processors: 1,
    processor: 1,
    cpu: 1,

    motherboards: 2,
    motherboard: 2,

    "graphic cards": 3,
    "graphics cards": 3,
    "graphic card": 3,
    "graphics card": 3,
    gpu: 3,

    "pc cabinet": 4,
    cabinet: 4,
    cabinets: 4,
    "pc case": 4,

    "power supply": 5,
    "power supplies": 5,
    psu: 5,

    "cpu cooler": 6,
    "cpu coolers": 6,

    ram: 7,
    memory: 7,

    ssd: 8,
    storage: 8,

    mouse: 9,
    mice: 9,

    keyboards: 10,
    keyboard: 10,

    headphones: 11,
    headphone: 11,

    mousepad: 12,
    mousepads: 12,

    monitors: 13,
    monitor: 13,

    laptops: 14,
    laptop: 14,

    "pc builds": 15,
    "pc build": 15,
  };

  const normalizedCategory = String(category || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return categoryMap[normalizedCategory] ?? null;
}


function createDatabasePayload(product) {
  const image = String(product.image || "");

  return {
    name: product.name.trim(),

    slug:
      product.handle ||
      product.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),

    sku: product.sku || null,

    brand: product.vendor || null,

    short_description: product.description || "",

    description: product.description || "",

    category_id: getCategoryId(product.category),

    price: Number(product.price) || 0,

    compare_at_price:
      Number(product.oldPrice) > 0
        ? Number(product.oldPrice)
        : null,

    cost_price:
      Number(product.cost) > 0
        ? Number(product.cost)
        : null,

    stock_quantity: Math.max(
      0,
      Number(product.stock) || 0
    ),

    low_stock_threshold: 5,

    // Hostinger stores image URLs, not browser data URLs.
    image_url:
      image.startsWith("data:")
        ? null
        : image || null,

    is_featured: Boolean(product.isFeatured),

    is_special_offer:
      Boolean(product.isSpecialOffer) ||
      product.tag === "Special Offer",

    is_active:
      product.status === "Active" &&
      product.published !== false,
      specifications: Array.isArray(product.specifications)
  ? product.specifications
  : [],
  };
}

async function saveProductToDatabase(product, databaseId) {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin session expired. Please log in again.");
  }

  const isEditingDatabaseProduct = Boolean(databaseId);

  const response = await fetch(ADMIN_PRODUCTS_API, {
    method: isEditingDatabaseProduct ? "PUT" : "POST",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify({
      ...(isEditingDatabaseProduct
        ? { id: Number(databaseId) }
        : {}),

      ...createDatabasePayload(product),
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Failed to save product to Hostinger."
    );
  }

  return {
    ...product,
    id: Number(data.id || databaseId),
    dbId: Number(data.id || databaseId),
  };
}


async function deleteProductFromDatabase(product) {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin session expired. Please log in again.");
  }

  const databaseId = product.dbId || product.id;

  if (
    !Number.isInteger(Number(databaseId)) ||
    Number(databaseId) < 1
  ) {
    throw new Error(
      `Invalid database ID for product "${product.name}".`
    );
  }

  const response = await fetch(ADMIN_PRODUCTS_API, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify({
      id: Number(databaseId),
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || `Failed to delete "${product.name}".`
    );
  }

  return true;
}


export default function AdminProductsPage() {
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [databaseCategories, setDatabaseCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [inventory, setInventory] = useState("All inventory");
  const [sort, setSort] = useState("newest");

  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [imageBusy, setImageBusy] = useState(false);
  const activeCategorySpecifications =
  databaseCategories.find(
    (item) =>
      String(item.name).toLowerCase() ===
      String(editing?.category || "").toLowerCase()
  )?.specification_fields || [];

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const token = localStorage.getItem("braintech-admin-token");

        if (!token) {
          throw new Error("Admin session not found. Please log in again.");
        }

        const response = await fetch("/api/admin/products", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load products."
          );
        }
        setDatabaseCategories(
  Array.isArray(data.categories) ? data.categories : []
);

        if (!Array.isArray(data.products)) {
          throw new Error("Hostinger returned an invalid products list.");
        }

        const databaseProducts = data.products.map((product) =>
          normalizeProduct({
            ...product,
            id: product.id,
            category: product.category || "Other",
            price: product.price,
            oldPrice: product.compare_at_price,
            image: product.image_url,
            vendor: product.brand,
            handle: product.slug,
            stock: product.stock_quantity,
            cost: product.cost_price,
            status: Number(product.is_active) === 1 ? "Active" : "Draft",
            published: Number(product.is_active) === 1,
            specifications: Array.isArray(product.specifications)
  ? product.specifications
  : [],
          })
        );

        if (!cancelled) {
          setItems(databaseProducts);
        }
      } catch (error) {
        console.error("Hostinger products loading error:", error);

        if (!cancelled) {
          setFormError(
            error.message || "Unable to load products from Hostinger."
          );
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);


  // Persist changes made by bulk actions, deletion, and reset.
  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save admin products:", error);
    }
  }, [items, ready]);

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  const categoryOptions = useMemo(() => {
    const fromStore = storeCategories.map((entry) =>
      Array.isArray(entry) ? entry[0] : entry
    );
    const fromProducts = items.map((product) => product.category);

    return [...new Set([...fromStore, ...fromProducts])]
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [items]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = items.filter((product) => {
      const searchable = [
        product.name,
        product.category,
        product.sku,
        product.barcode,
        product.vendor,
        product.productType,
        product.handle,
        product.id,
        ...(product.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory =
        category === "All categories" || product.category === category;
      const matchesStatus =
        status === "All statuses" || product.status === status;

      const matchesInventory =
        inventory === "All inventory" ||
        (inventory === "In stock" && product.stock > LOW_STOCK_LIMIT) ||
        (inventory === "Low stock" &&
          product.stock > 0 &&
          product.stock <= LOW_STOCK_LIMIT) ||
        (inventory === "Out of stock" && product.stock === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesInventory
      );
    });

    return result.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "stock-low") return a.stock - b.stock;
      return Number(b.id) - Number(a.id);
    });
  }, [items, search, category, status, inventory, sort]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "Active").length,
      draft: items.filter((item) => item.status === "Draft").length,
      outOfStock: items.filter((item) => item.stock === 0).length,
      lowStock: items.filter(
        (item) => item.stock > 0 && item.stock <= LOW_STOCK_LIMIT
      ).length,
    }),
    [items]
  );

  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selected.includes(product.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredProducts.map((product) => product.id));

      setSelected((previous) =>
        previous.filter((id) => !visibleIds.has(id))
      );
    } else {
      setSelected((previous) => [
        ...new Set([
          ...previous,
          ...filteredProducts.map((product) => product.id),
        ]),
      ]);
    }
  }

  function toggleSelected(id) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((itemId) => itemId !== id)
        : [...previous, id]
    );
  }

  function openNewProduct() {
    setEditing(makeEmptyProduct(categoryOptions[0] || "Processors"));
    setActiveTab("general");
    setFormError("");
    setImageBusy(false);
    setShowForm(true);
  }

  function openEditProduct(product) {
    setEditing({ ...product });
    setActiveTab("general");
    setFormError("");
    setImageBusy(false);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setFormError("");
    setImageBusy(false);
  }

  function changeField(name, value) {
    setEditing((previous) =>
      previous ? { ...previous, [name]: value } : previous
    );
  }


async function handleImageUpload(event) {
  const file = event.target.files?.[0];

  // Allow selecting the same file again.
  event.target.value = "";

  if (!file) return;

  setImageBusy(true);
  setFormError("");

  try {
    // Keep your existing image compression.
    const compressedImage = await compressImage(file);

    // Convert compressed data URL back into a file.
    const response = await fetch(compressedImage);
    const blob = await response.blob();

    const imageFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg" }
    );

    // Send image to the Next.js upload API.
    const uploadForm = new FormData();
    uploadForm.append("image", imageFile);

    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin session expired. Please log in again.");
    }

    const uploadResponse = await fetch(
      "/api/admin/upload-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadForm,
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.success) {
      throw new Error(
        uploadData.message || "Image upload failed."
      );
    }

    if (!uploadData.image_url) {
      throw new Error("Hostinger did not return an image URL.");
    }

    // Store the permanent Hostinger URL in the product form.
    setEditing((previous) =>
      previous
        ? {
            ...previous,
            image: uploadData.image_url,
          }
        : previous
    );

    setNotice("Product image uploaded successfully.");
  } catch (error) {
    console.error("BrainTech image upload error:", error);

    setFormError(
      error.message || "Could not upload product image."
    );
  } finally {
    setImageBusy(false);
  }
}

async function saveProduct(event) {
  event.preventDefault();
  setFormError("");

  if (!editing) return;

  const form = new FormData(event.currentTarget);

  const name = String(form.get("name") || "").trim();
  const priceText = String(form.get("price") ?? "").trim();
  const stockText = String(form.get("stock") ?? "").trim();
  const costText = String(form.get("cost") ?? "").trim();
  const weightText = String(form.get("weight") ?? "").trim();

  const price = Number(priceText);
  const oldPrice = Number(form.get("oldPrice") || 0);
  const stock = Number(stockText);
  const cost = Number(costText || 0);
  const weight = Number(weightText || 0);

  if (!name) {
    setFormError("Enter a product title.");
    setActiveTab("general");
    return;
  }

  if (priceText === "" || !Number.isFinite(price) || price < 0) {
    setFormError("Enter a valid selling price.");
    setActiveTab("pricing");
    return;
  }

  if (!Number.isFinite(oldPrice) || oldPrice < 0) {
    setFormError("Enter a valid compare-at price.");
    setActiveTab("pricing");
    return;
  }

  if (stockText === "" || !Number.isInteger(stock) || stock < 0) {
    setFormError(
      "Stock must be a whole number greater than or equal to zero."
    );
    setActiveTab("inventory");
    return;
  }

  if (!Number.isFinite(cost) || cost < 0) {
    setFormError("Enter a valid product cost.");
    setActiveTab("pricing");
    return;
  }

  if (!Number.isFinite(weight) || weight < 0) {
    setFormError("Enter a valid shipping weight.");
    setActiveTab("shipping");
    return;
  }

  const existingId =
    editing.id !== "" && editing.id != null
      ? editing.id
      : null;

  const baseHandle = slugify(form.get("handle") || name);

  if (!baseHandle) {
    setFormError("Enter a valid URL handle.");
    setActiveTab("organisation");
    return;
  }

  let handle = baseHandle;
  let suffix = 2;

  while (
    items.some(
      (product) =>
        product.handle === handle &&
        String(product.id) !== String(existingId)
    )
  ) {
    handle = `${baseHandle}-${suffix}`;
    suffix++;
  }

  let options;
  let variants;

  try {
    options = parseJsonField(
      form.get("optionsJson"),
      "Product options"
    );

    variants = parseJsonField(
      form.get("variantsJson"),
      "Product variants"
    );
  } catch (error) {
    setFormError(error.message);
    setActiveTab("variants");
    return;
  }

  const rawStatus = String(form.get("status") || "Draft");
  const published = form.get("published") === "true";

  const selectedCategory = String(
    form.get("category") || "Other"
  );

  const selectedCategoryFields =
    databaseCategories.find(
      (item) =>
        String(item.name).toLowerCase() ===
        selectedCategory.toLowerCase()
    )?.specification_fields || [];

  const specifications = [];

  for (const field of selectedCategoryFields) {
    const rawValue = form.get(`specification_${field.id}`);
    const value = String(rawValue ?? "").trim();

    if (Number(field.is_required) === 1 && value === "") {
      setFormError(`Please enter ${field.field_label}.`);
      setActiveTab("specifications");
      return;
    }

    if (value !== "") {
      if (
        field.input_type === "number" &&
        !Number.isFinite(Number(value))
      ) {
        setFormError(`Enter a valid number for ${field.field_label}.`);
        setActiveTab("specifications");
        return;
      }

      specifications.push({
        field_id: Number(field.id),
        value,
      });
    }
  }


  const numericIds = items
    .map((product) => Number(product.id))
    .filter(Number.isFinite);

  const id =
    existingId ??
    Math.max(Date.now(), ...numericIds.map((value) => value + 1), 1);

  const product = normalizeProduct(
    {
      ...editing,

      id,

      name,

     category: selectedCategory,

specifications,

      price,

      oldPrice,

      image: editing.image || "",

      tag: String(form.get("tag") || "").trim(),

      description: String(
        form.get("description") || ""
      ).trim(),

      vendor: String(
        form.get("vendor") || ""
      ).trim(),

      productType: String(
        form.get("productType") || ""
      ).trim(),

      tags: String(form.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),

      handle,

      sku:
        String(form.get("sku") || "").trim() ||
        `BT-${id}`,

      barcode: String(
        form.get("barcode") || ""
      ).trim(),

      cost,

      stock,

      status: rawStatus,

      published:
        rawStatus === "Active" && published,

      taxable: form.get("taxable") === "on",

      requiresShipping:
        form.get("requiresShipping") === "on",

      weight,

      weightUnit: String(
        form.get("weightUnit") || "kg"
      ),

      seoTitle:
        String(form.get("seoTitle") || "").trim() ||
        name,

      seoDescription:
        String(form.get("seoDescription") || "").trim() ||
        String(form.get("description") || "").trim(),

      options,

      variants,

      createdAt:
        editing.createdAt ||
        new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    },
    items.length
  );

  // Existing database products use their database ID.
  // New products are inserted into Hostinger.
  const databaseId = editing.dbId || (
    existingId &&
    Number.isInteger(Number(existingId)) &&
    Number(existingId) < 1000000000000
      ? existingId
      : null
  );

  try {
    setSaving(true);

    const savedProduct = await saveProductToDatabase(
      product,
      databaseId
    );

    // Keep the database-generated ID after inserting a new product.
    const finalProduct = normalizeProduct(
      {
        ...product,
        ...savedProduct,
        id: savedProduct.id,
        dbId: savedProduct.dbId || savedProduct.id,
        createdAt:
          product.createdAt ||
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      items.length
    );

    const updatedItems = existingId
      ? items.map((item) =>
          String(item.id) === String(existingId)
            ? finalProduct
            : item
        )
      : [finalProduct, ...items];

    // Save a local cache only after Hostinger confirms success.
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedItems)
      );
    } catch (storageError) {
      console.error(
        "Product saved to database, but local cache failed:",
        storageError
      );
    }

    setItems(updatedItems);

    setSelected((previous) =>
      previous.filter((selectedId) =>
        updatedItems.some(
          (item) =>
            String(item.id) === String(selectedId)
        )
      )
    );

    setNotice(
      databaseId
        ? "Product and metadata updated."
        : "Product created successfully."
    );

    closeForm();
  } catch (error) {
    console.error("Product save failed:", error);

    setFormError(
      error.message ||
        "Unable to save product to Hostinger."
    );
  } finally {
    setSaving(false);
  }
}


  function changeStatusForSelected(nextStatus) {
    if (!selected.length) return;

    const count = selected.length;

    setItems((previous) =>
      previous.map((product) =>
        selected.includes(product.id)
          ? {
              ...product,
              status: nextStatus,
              published:
                nextStatus === "Active" ? product.published : false,
              updatedAt: new Date().toISOString(),
            }
          : product
      )
    );

    setSelected([]);
    setNotice(`${count} selected product(s) updated.`);
  }

async function deleteSelected() {
  if (!selected.length) return;

  const productsToDelete = items.filter((product) =>
    selected.some(
      (id) => String(id) === String(product.id)
    )
  );

  if (!productsToDelete.length) return;

  if (
    !window.confirm(
      `Delete ${productsToDelete.length} selected product(s)? This cannot be undone.`
    )
  ) {
    return;
  }

  const deletedIds = [];
  const failedProducts = [];

  for (const product of productsToDelete) {
    try {
      await deleteProductFromDatabase(product);

      deletedIds.push(String(product.id));
    } catch (error) {
      console.error(
        `Failed to delete product "${product.name}":`,
        error
      );

      failedProducts.push(product.name);
    }
  }

  if (deletedIds.length > 0) {
    setItems((previous) =>
      previous.filter(
        (product) =>
          !deletedIds.includes(String(product.id))
      )
    );

    setSelected((previous) =>
      previous.filter(
        (id) => !deletedIds.includes(String(id))
      )
    );
  }

  if (failedProducts.length === 0) {
    setNotice(
      `${deletedIds.length} product(s) deleted successfully.`
    );
  } else {
    setNotice(
      `${deletedIds.length} deleted. ${failedProducts.length} failed: ${failedProducts.join(", ")}`
    );
  }
}


async function deleteOne(product) {
  if (
    !window.confirm(
      `Delete "${product.name}" from the admin catalogue?`
    )
  ) {
    return;
  }

  try {
    await deleteProductFromDatabase(product);

    setItems((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(product.id)
      )
    );

    setSelected((previous) =>
      previous.filter(
        (id) => String(id) !== String(product.id)
      )
    );

    setNotice("Product deleted successfully.");
  } catch (error) {
    console.error("Product deletion failed:", error);

    setNotice(
      error.message || "Unable to delete product."
    );
  }
}

  function resetCatalogue() {
    if (
      !window.confirm(
        "Restore the starter catalogue? Your saved admin product edits and additions will be lost."
      )
    ) {
      return;
    }

    const restored = seedProducts.map(normalizeProduct);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
    } catch (error) {
      console.error("Could not reset catalogue:", error);
      setNotice("Could not reset the catalogue because browser storage failed.");
      return;
    }

    setItems(restored);
    setSelected([]);
    setSearch("");
    setCategory("All categories");
    setStatus("All statuses");
    setInventory("All inventory");
    setSort("newest");
    setNotice("Starter catalogue restored.");
  }

  if (!ready) {
    return (
      <div className="products-admin-page">
        <div className="products-admin-loading">Loading products…</div>
      </div>
    );
  }

  return (
    <div className="products-admin-page">
      <header className="products-admin-heading">
        <div>
          <div className="products-admin-eyebrow">CATALOGUE MANAGEMENT</div>
          <h1>Products</h1>
          <p>
            Manage products, metadata, pricing, inventory, variants and SEO.
          </p>
        </div>

        <div className="products-admin-heading-actions">
          <button
            className="products-admin-button products-admin-button-secondary"
            onClick={resetCatalogue}
            type="button"
          >
            Reset demo data
          </button>
          <button
            className="products-admin-button products-admin-button-primary"
            onClick={openNewProduct}
            type="button"
          >
            ＋ Add product
          </button>
        </div>
      </header>

      <section className="products-admin-stats">
        <article className="products-admin-stat">
          <span>Total products</span>
          <strong>{stats.total}</strong>
          <small>Across all categories</small>
        </article>
        <article className="products-admin-stat">
          <span>Active</span>
          <strong>{stats.active}</strong>
          <small>Active product records</small>
        </article>
        <article className="products-admin-stat">
          <span>Drafts</span>
          <strong>{stats.draft}</strong>
          <small>Not ready for publishing</small>
        </article>
        <article className="products-admin-stat">
          <span>Inventory alerts</span>
          <strong>{stats.outOfStock + stats.lowStock}</strong>
          <small>
            {stats.outOfStock} out of stock · {stats.lowStock} low stock
          </small>
        </article>
      </section>

      <section className="products-admin-panel">
        <div className="products-admin-panel-title">
          <div>
            <h2>All products</h2>
            <p>{filteredProducts.length} products shown</p>
          </div>
          {selected.length > 0 && (
            <span className="products-admin-selected-count">
              {selected.length} selected
            </span>
          )}
        </div>

        <div className="products-admin-filters">
          <label className="products-admin-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, SKU, vendor, tag or ID…"
              aria-label="Search products"
            />
          </label>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option>All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option>All statuses</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>

          <select
            value={inventory}
            onChange={(event) => setInventory(event.target.value)}
            aria-label="Filter by inventory"
          >
            <option>All inventory</option>
            <option>In stock</option>
            <option>Low stock</option>
            <option>Out of stock</option>
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
          >
            <option value="newest">Newest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="stock-low">Stock: low to high</option>
          </select>
        </div>

        {selected.length > 0 && (
          <div className="products-admin-bulkbar">
            <span>{selected.length} selected</span>
            <button type="button" onClick={() => changeStatusForSelected("Active")}>
              Set active
            </button>
            <button type="button" onClick={() => changeStatusForSelected("Draft")}>
              Set draft
            </button>
            <button type="button" onClick={() => changeStatusForSelected("Archived")}>
              Archive
            </button>
            <button
              type="button"
              className="products-admin-danger-text"
              onClick={deleteSelected}
            >
              Delete
            </button>
            <button type="button" onClick={() => setSelected([])}>
              Clear selection
            </button>
          </div>
        )}

        <div className="products-admin-table-wrap">
          <table className="products-admin-table">
            <thead>
              <tr>
                <th className="products-admin-check-cell">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all visible products"
                  />
                </th>
                <th>Product</th>
                <th>Status</th>
                <th>Inventory</th>
                <th>Category</th>
                <th>Price</th>
                <th>SKU</th>
                <th className="products-admin-action-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="products-admin-check-cell">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td>
                    <div className="products-admin-product-cell">
                      <div className="products-admin-thumb">
                        {product.image ? (
                          <img src={product.image} alt="" loading="lazy" />
                        ) : (
                          <span aria-hidden="true">▧</span>
                        )}
                      </div>
                      <div className="products-admin-product-name">
                        <strong>{product.name}</strong>
                        <small>
                          ID: {product.id}
                          {product.vendor ? ` · ${product.vendor}` : ""}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`products-admin-status products-admin-status-${product.status.toLowerCase()}`}
                    >
                      <i />
                      {product.status}
                    </span>
                    {product.status === "Active" && (
                      <small className="products-admin-published-note">
                        {product.published ? "Published" : "Unpublished"}
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        product.stock === 0
                          ? "products-admin-stock-out"
                          : product.stock <= LOW_STOCK_LIMIT
                            ? "products-admin-stock-low"
                            : "products-admin-stock-good"
                      }
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : `${product.stock} in stock`}
                    </span>
                  </td>
                  <td>
                    <span className="products-admin-category">
                      {product.category}
                    </span>
                  </td>
                  <td className="products-admin-price">
                    {formatPrice(product.price)}
                    {product.oldPrice > product.price && (
                      <small>{formatPrice(product.oldPrice)}</small>
                    )}
                  </td>
                  <td className="products-admin-sku">{product.sku}</td>
                  <td className="products-admin-action-cell">
                    <div className="products-admin-row-actions">
                      <button
                        type="button"
                        onClick={() => openEditProduct(product)}
                        aria-label={`Edit ${product.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="products-admin-delete-action"
                        onClick={() => deleteOne(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="products-admin-empty">
              <span aria-hidden="true">⌕</span>
              <h3>No products found</h3>
              <p>Try a different search or change your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All categories");
                  setStatus("All statuses");
                  setInventory("All inventory");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <footer className="products-admin-table-footer">
          <span>
            Showing {filteredProducts.length} of {items.length} products
          </span>
          <span>Saved in this browser</span>
        </footer>
      </section>

      {notice && (
        <div className="products-admin-toast" role="status">
          ✓ {notice}
        </div>
      )}

      {showForm && editing && (
        <div
          className="products-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="products-admin-modal products-admin-product-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-admin-form-title"
          >
            <header className="products-admin-modal-heading">
              <div>
                <div className="products-admin-eyebrow">
                  PRODUCT MANAGEMENT
                </div>
                <h2 id="products-admin-form-title">
                  {editing.id ? "Edit product" : "Add product"}
                </h2>
                <p>
                  Manage product information, metadata, inventory and search
                  engine listing.
                </p>
              </div>
              <button
                type="button"
                className="products-admin-close"
                onClick={closeForm}
                aria-label="Close product form"
              >
                ×
              </button>
            </header>

            <nav className="products-admin-editor-tabs" aria-label="Product sections">
              {TABS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={activeTab === value ? "active" : ""}
                  onClick={() => {
                    setActiveTab(value);
                    setFormError("");
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <form
              className="products-admin-form"
              onSubmit={saveProduct}
              noValidate
            >
              {formError && (
                <div className="products-admin-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="products-admin-editor-body">
                {/* Keep every tab mounted so FormData retains every field. */}
                <div hidden={activeTab !== "general"}>
                  <Section
                    title="Product details"
                    description="The title and description customers will see on your product page."
                  >
                    <div className="products-admin-form-grid">
                      <Field label="Title *" full>
                        <input
                          name="name"
                          value={editing.name}
                          onChange={(event) => changeField("name", event.target.value)}
                          placeholder="e.g. GeForce RTX graphics card"
                        />
                      </Field>
                      <Field label="Description" full>
                        <textarea
                          name="description"
                          rows="6"
                          value={editing.description}
                          onChange={(event) => changeField("description", event.target.value)}
                          placeholder="Describe the product, benefits and specifications…"
                        />
                      </Field>
                    </div>
                  </Section>

                  <Section
                    title="Product media"
                    description="Upload a downloaded image directly from your computer."
                  >
                    <div className="products-admin-form-grid">
                      <Field
                        label="Choose product image"
                        full
                        hint="JPG, PNG or WebP. Maximum file size: 15 MB before compression."
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          disabled={imageBusy}
                        />
                      </Field>

                      {imageBusy && (
                        <p className="products-admin-inline-note">
                          Processing image…
                        </p>
                      )}

                      {editing.image && (
                        <div className="products-admin-media-preview products-admin-field-full">
                          <img
                            src={editing.image}
                            alt="Product preview"
                          />
                          <span>Image preview</span>
                          <button
                            type="button"
                            className="products-admin-button products-admin-button-secondary"
                            onClick={() => changeField("image", "")}
                          >
                            Remove image
                          </button>
                        </div>
                      )}

                      <Field label="Product badge" full>
                        <input
                          name="tag"
                          defaultValue={editing.tag}
                          placeholder="Bestseller, New arrival, Deal…"
                        />
                      </Field>
                    </div>
                    <p className="products-admin-inline-note">
                      Images currently save in this browser. Permanent shared
                      image storage will be connected when we set up Hostinger.
                    </p>
                  </Section>

                  <Section title="Publishing">
                    <div className="products-admin-form-grid">
                      <Field label="Product status">
                        <select name="status" defaultValue={editing.status}>
                          <option>Draft</option>
                          <option>Active</option>
                          <option>Archived</option>
                        </select>
                      </Field>
                      <Field label="Storefront visibility">
                        <select
                          name="published"
                          defaultValue={String(editing.published)}
                        >
                          <option value="true">Published</option>
                          <option value="false">Unpublished</option>
                        </select>
                      </Field>
                    </div>
                    <p className="products-admin-inline-note">
                      Draft and archived products cannot be published. Active
                      products can still be kept unpublished.
                    </p>
                  </Section>
                </div>

                <div hidden={activeTab !== "organisation"}>
                  <Section
                    title="Product organisation"
                    description="Organise products for browsing, filtering and merchandising."
                  >
                    <div className="products-admin-form-grid">
                      <Field label="Category *">
                        <select
                          name="category"
                          value={editing.category}
                          onChange={(event) => changeField("category", event.target.value)}
                        >
                          {!categoryOptions.includes(editing.category) && (
                            <option value={editing.category}>
                              {editing.category}
                            </option>
                          )}
                          {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          {!categoryOptions.includes("Other") && (
                            <option value="Other">Other</option>
                          )}
                        </select>
                      </Field>
                      <Field label="Vendor / brand">
                        <input
                          name="vendor"
                          defaultValue={editing.vendor}
                          placeholder="AMD, Intel, ASUS…"
                        />
                      </Field>
                      <Field label="Product type">
                        <input
                          name="productType"
                          defaultValue={editing.productType}
                          placeholder="Graphics card, processor…"
                        />
                      </Field>
                      <Field label="Tags" full hint="Separate tags with commas.">
                        <input
                          name="tags"
                          defaultValue={editing.tags.join(", ")}
                          placeholder="gaming, nvidia, bestseller"
                        />
                      </Field>
                      <Field label="Product URL handle" full>
                        <input
                          name="handle"
                          value={editing.handle}
                          onChange={(event) => changeField("handle", event.target.value)}
                          placeholder="graphics-card-rtx"
                        />
                      </Field>
                    </div>
                  </Section>
                </div>

                <div hidden={activeTab !== "specifications"}>
                  <Section
                    title="Product specifications"
                    description="These fields are automatically loaded from the selected product category."
                  >
                    {activeCategorySpecifications.length === 0 ? (
                      <p className="products-admin-inline-note">
                        No specification fields are configured for this
                        category yet.
                      </p>
                    ) : (
                      <div className="products-admin-form-grid">
                        {activeCategorySpecifications.map((field) => {
                          const existingValue =
                            editing.specifications?.find(
                              (spec) =>
                                Number(spec.field_id) === Number(field.id)
                            )?.value ?? "";

                          let options = [];

                          try {
                            options = Array.isArray(field.options_json)
                              ? field.options_json
                              : JSON.parse(field.options_json || "[]");
                          } catch {
                            options = [];
                          }

                          return (
                            <Field
                              key={field.id}
                              label={`${field.field_label}${Number(field.is_required) === 1 ? " *" : ""}`}
                              hint={field.unit_label || ""}
                            >
                              {field.input_type === "textarea" ? (
                                <textarea
                                  name={`specification_${field.id}`}
                                  rows="3"
                                  defaultValue={existingValue}
                                  placeholder={`Enter ${field.field_label.toLowerCase()}`}
                                  required={Number(field.is_required) === 1}
                                />
                              ) : field.input_type === "select" ? (
                                <select
                                  name={`specification_${field.id}`}
                                  defaultValue={existingValue}
                                  required={Number(field.is_required) === 1}
                                >
                                  <option value="">Select {field.field_label}</option>
                                  {options.map((option, index) => (
                                    <option
                                      key={index}
                                      value={option}
                                    >
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : field.input_type === "boolean" ? (
                                <select
                                  name={`specification_${field.id}`}
                                  defaultValue={existingValue}
                                >
                                  <option value="">Select</option>
                                  <option value="1">Yes</option>
                                  <option value="0">No</option>
                                </select>
                              ) : (
                                <input
                                  type={
                                    field.input_type === "number"
                                      ? "number"
                                      : "text"
                                  }
                                  name={`specification_${field.id}`}
                                  defaultValue={existingValue}
                                  placeholder={`Enter ${field.field_label.toLowerCase()}`}
                                  required={Number(field.is_required) === 1}
                                />
                              )}
                            </Field>
                          );
                        })}
                      </div>
                    )}
                  </Section>
                </div>

                <div hidden={activeTab !== "pricing"}>
                  <Section
                    title="Pricing"
                    description="Set the selling price, comparison price and product cost."
                  >
                    <div className="products-admin-form-grid">
                      <Field label="Selling price (₹) *">
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editing.price}
                          onChange={(event) => changeField("price", event.target.value)}
                        />
                      </Field>
                      <Field label="Compare-at price (₹)" hint="Optional original or reference price.">
                        <input
                          name="oldPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={editing.oldPrice}
                        />
                      </Field>
                      <Field label="Cost per item (₹)">
                        <input
                          name="cost"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={editing.cost}
                        />
                      </Field>
                      <Field label="Estimated margin">
                        <div className="products-admin-readonly-value">
                          {Number(editing.price) > 0
                            ? `${(((Number(editing.price) - Number(editing.cost || 0)) / Number(editing.price)) * 100).toFixed(1)}%`
                            : "Set a selling price"}
                        </div>
                        <small>Estimate only; excludes other expenses.</small>
                      </Field>
                    </div>
                  </Section>
                  <Section title="Tax">
                    <label className="products-admin-check-option">
                      <input
                        type="checkbox"
                        name="taxable"
                        defaultChecked={editing.taxable}
                      />
                      <span>
                        <strong>Charge tax on this product</strong>
                        <small>Tax calculation and compliance must be configured separately.</small>
                      </span>
                    </label>
                  </Section>
                </div>

                <div hidden={activeTab !== "inventory"}>
                  <Section
                    title="Inventory details"
                    description="Identify the product and maintain its current stock quantity."
                  >
                    <div className="products-admin-form-grid">
                      <Field label="SKU">
                        <input name="sku" defaultValue={editing.sku} placeholder="BT-GPU-001" />
                      </Field>
                      <Field label="Barcode">
                        <input name="barcode" defaultValue={editing.barcode} placeholder="UPC, EAN or other identifier" />
                      </Field>
                      <Field label="Available stock *">
                        <input
                          name="stock"
                          type="number"
                          min="0"
                          step="1"
                          value={editing.stock}
                          onChange={(event) => changeField("stock", event.target.value)}
                        />
                      </Field>
                      <Field label="Stock status">
                        <div className="products-admin-readonly-value">
                          {Number(editing.stock) === 0
                            ? "Out of stock"
                            : Number(editing.stock) <= LOW_STOCK_LIMIT
                              ? "Low stock"
                              : "In stock"}
                        </div>
                      </Field>
                    </div>
                    <p className="products-admin-inline-note">
                      Inventory is currently saved in this browser. Stock
                      movement history and multi-location inventory require
                      the database-backed inventory module.
                    </p>
                  </Section>
                </div>

                <div hidden={activeTab !== "variants"}>
                  <Section
                    title="Product options"
                    description="Define option names and values, such as colour, memory or configuration."
                  >
                    <Field
                      label="Options JSON"
                      full
                      hint={'Example: [{"name":"Colour","values":["Black","White"]}]'}
                    >
                      <textarea
                        name="optionsJson"
                        rows="5"
                        defaultValue={JSON.stringify(editing.options, null, 2)}
                        spellCheck={false}
                      />
                    </Field>
                  </Section>
                  <Section
                    title="Variants"
                    description="Store variant-specific identifiers, prices and stock."
                  >
                    <Field
                      label="Variants JSON"
                      full
                      hint={'Example: [{"id":"black-16gb","title":"Black / 16GB","sku":"BT-001-BLK","price":49999,"stock":5}]'}
                    >
                      <textarea
                        name="variantsJson"
                        rows="9"
                        defaultValue={JSON.stringify(editing.variants, null, 2)}
                        spellCheck={false}
                      />
                    </Field>
                    <p className="products-admin-inline-note">
                      Variant metadata can be saved here. Automatic variant
                      generation and per-variant inventory deduction will be
                      connected in a later step.
                    </p>
                  </Section>
                </div>

                <div hidden={activeTab !== "shipping"}>
                  <Section
                    title="Shipping information"
                    description="Set the physical-product and weight information."
                  >
                    <label className="products-admin-check-option">
                      <input
                        type="checkbox"
                        name="requiresShipping"
                        defaultChecked={editing.requiresShipping}
                      />
                      <span>
                        <strong>This is a physical product</strong>
                        <small>Uncheck for digital products or services.</small>
                      </span>
                    </label>
                    <div className="products-admin-form-grid">
                      <Field label="Product weight">
                        <input
                          name="weight"
                          type="number"
                          min="0"
                          step="0.001"
                          defaultValue={editing.weight}
                        />
                      </Field>
                      <Field label="Weight unit">
                        <select name="weightUnit" defaultValue={editing.weightUnit}>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="g">Grams (g)</option>
                          <option value="lb">Pounds (lb)</option>
                          <option value="oz">Ounces (oz)</option>
                        </select>
                      </Field>
                    </div>
                    <p className="products-admin-inline-note">
                      Shipping rates, courier labels and fulfilment integrations
                      are separate workflows.
                    </p>
                  </Section>
                </div>

                <div hidden={activeTab !== "seo"}>
                  <Section
                    title="Search engine listing"
                    description="Control the metadata used to describe the product in search results."
                  >
                    <div className="products-admin-form-grid">
                      <Field label="SEO title" full>
                        <input
                          name="seoTitle"
                          maxLength={70}
                          defaultValue={editing.seoTitle}
                          placeholder="Product title for search engines"
                        />
                      </Field>
                      <Field label="SEO description" full>
                        <textarea
                          name="seoDescription"
                          rows="4"
                          maxLength={320}
                          defaultValue={editing.seoDescription}
                          placeholder="A concise description of this product…"
                        />
                      </Field>
                    </div>
                  </Section>
                  <Section title="Search preview">
                    <div className="products-admin-seo-preview">
                      <strong>{editing.seoTitle || editing.name || "Product title"}</strong>
                      <span>
                        braintechpc.in/products/{editing.handle || slugify(editing.name) || "product"}
                      </span>
                      <p>
                        {editing.seoDescription ||
                          editing.description ||
                          "Your product description will appear here."}
                      </p>
                    </div>
                  </Section>
                </div>
              </div>

              <footer className="products-admin-form-footer">
                <button
                  type="button"
                  className="products-admin-button products-admin-button-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imageBusy}
                  className="products-admin-button products-admin-button-primary"
                >
                  {imageBusy
                    ? "Processing image…"
                    : editing.id
                      ? "Save product"
                      : "Create product"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

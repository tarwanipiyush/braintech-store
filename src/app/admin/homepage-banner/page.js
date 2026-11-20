
"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const PAGE_OPTIONS = [
  { value: "homepage", label: "Homepage" },
  { value: "shop", label: "Shop" },
  { value: "product", label: "Product Pages" },
  { value: "all", label: "All Pages" },
];

const PLACEMENT_OPTIONS = [
  { value: "top", label: "Top of Page" },
  { value: "below_hero", label: "Below Hero" },
  { value: "between_sections", label: "Between Sections" },
  { value: "before_footer", label: "Before Footer" },
];

function getPageLabel(value) {
  return PAGE_OPTIONS.find((item) => item.value === value)?.label || "Homepage";
}

function getPlacementLabel(value) {
  return PLACEMENT_OPTIONS.find((item) => item.value === value)?.label || "Top of Page";
}

const emptyBanner = () => ({
  id: "",
  title: "",
  subtitle: "",
  buttonText: "Shop Now",
  buttonLink: "/products",
  image: "",
  status: "Active",
  position: 1,
  displayOn: "homepage",
  placement: "top",
});

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("braintech-admin-token") || "";
}

async function apiRequest(path, method = "GET", body = null) {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin session not found. Please log in again.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  const options = {
    method,
    headers,
    cache: "no-store",
  };

  if (body !== null) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);
  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (HTTP ${response.status}).`
    );
  }

  return data;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 15 MB."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read this image."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("This image could not be opened."));

      image.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Your browser could not process this image."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed."));
              return;
            }

            const compressedFile = new File(
              [blob],
              `banner-${Date.now()}.jpg`,
              { type: "image/jpeg" }
            );

            resolve(compressedFile);
          },
          "image/jpeg",
          0.78
        );
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

export default function HomepageBannerPage() {
  const [banners, setBanners] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyBanner());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBanners(showLoader = false) {
    if (showLoader) setLoaded(false);

    try {
      const data = await apiRequest("/api/admin/banners");

      if (!Array.isArray(data.banners)) {
        throw new Error("The banners API returned an unexpected response.");
      }

      setBanners(data.banners);
      setError("");
      return data.banners;
    } catch (err) {
      setError(err.message || "Could not load banners from Hostinger.");
      return null;
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadBanners(true);
  }, []);

  const filteredBanners = useMemo(() => {
    return banners
      .filter((banner) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
          !query ||
          banner.title?.toLowerCase().includes(query) ||
          banner.subtitle?.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" || banner.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          Number(a.position || 1) - Number(b.position || 1)
      );
  }, [banners, search, statusFilter]);

  const activeCount = banners.filter(
    (banner) => banner.status === "Active"
  ).length;

  function openNewBanner() {
    setForm({
      ...emptyBanner(),
      position: banners.length + 1,
    });
    setEditing("new");
    setMessage("");
    setError("");
  }

  function openEditBanner(banner) {
    setForm({
      ...emptyBanner(),
      ...banner,
      displayOn: banner.displayOn || "homepage",
      placement: banner.placement || "top",
    });
    setEditing(banner.id);
    setMessage("");
    setError("");
  }

  function closeEditor() {
    if (saving || uploading) return;

    setEditing(null);
    setForm(emptyBanner());
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setMessage("");
    setUploading(true);

    try {
      setMessage("Preparing your banner image...");

      const compressedFile = await compressImage(file);
      const uploadData = new FormData();

      uploadData.append("image", compressedFile);

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session not found. Please log in again.");
      }

      const response = await fetch("/api/admin/upload-banner", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: uploadData,
        cache: "no-store",
      });

      const raw = await response.text();
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Image upload returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || !data.success || !data.image_url) {
        throw new Error(data.message || "Banner image upload failed.");
      }

      updateField("image", data.image_url);
      setMessage("Image uploaded successfully to Hostinger.");
    } catch (err) {
      setError(err.message || "Unable to upload this image.");
      setMessage("");
    } finally {
      setUploading(false);
    }
  }

  async function saveBanner(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Enter a banner title.");
      return;
    }

    if (!form.image) {
      setError("Upload a banner image before saving.");
      return;
    }

    if (
      form.buttonLink.trim() &&
      !form.buttonLink.trim().startsWith("/")
    ) {
      setError(
        "For now, use an internal link starting with /, such as /products."
      );
      return;
    }

    const bannerToSave = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      buttonText: form.buttonText.trim() || "Shop Now",
      buttonLink: form.buttonLink.trim() || "/products",
      image: form.image,
      status: form.status,
      position: Math.max(1, Number(form.position) || 1),
      displayOn: form.displayOn || "homepage",
      placement: form.placement || "top",
    };

    setSaving(true);

    try {
      if (editing === "new") {
        await apiRequest("/api/admin/banners", "POST", bannerToSave);
      } else {
        await apiRequest("/api/admin/banners", "PUT", {
          ...bannerToSave,
          id: editing,
        });
      }

      const refreshed = await loadBanners();

      if (refreshed === null) {
        throw new Error(
          "The banner was saved, but the updated list could not be loaded. Refresh the page to check it."
        );
      }

      setEditing(null);
      setForm(emptyBanner());
      setMessage(
        editing === "new"
          ? "Banner created and saved to Hostinger."
          : "Banner updated successfully."
      );
      setError("");
    } catch (err) {
      setError(err.message || "Could not save this banner.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(banner) {
    const nextStatus =
      banner.status === "Active" ? "Inactive" : "Active";

    setError("");
    setMessage("");

    try {
      await apiRequest("/api/admin/banners", "PUT", {
        ...banner,
        status: nextStatus,
      });

      const refreshed = await loadBanners();

      if (refreshed === null) {
        throw new Error("Status updated, but the banner list could not refresh.");
      }

      setMessage(
        nextStatus === "Active"
          ? "Banner activated successfully."
          : "Banner deactivated successfully."
      );
    } catch (err) {
      setError(err.message || "Could not update banner status.");
    }
  }

  async function deleteBanner(banner) {
    const confirmed = window.confirm(
      `Delete the banner "${banner.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await apiRequest("/api/admin/banners", "DELETE", {
        id: banner.id,
      });

      const refreshed = await loadBanners();

      if (refreshed === null) {
        throw new Error("Banner deleted, but the list could not refresh.");
      }

      setMessage("Banner deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete this banner.");
    }
  }

  async function moveBanner(banner, direction) {
    const sorted = [...banners].sort(
      (a, b) =>
        Number(a.position || 1) - Number(b.position || 1)
    );

    const index = sorted.findIndex(
      (item) => String(item.id) === String(banner.id)
    );

    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
      return;
    }

    const current = sorted[index];
    const target = sorted[nextIndex];

    const currentPosition = Number(current.position || index + 1);
    const targetPosition = Number(target.position || nextIndex + 1);

    setError("");
    setMessage("");

    try {
      await apiRequest("/api/admin/banners", "PUT", {
        ...current,
        position: targetPosition,
      });

      await apiRequest("/api/admin/banners", "PUT", {
        ...target,
        position: currentPosition,
      });

      const refreshed = await loadBanners();

      if (refreshed === null) {
        throw new Error("Positions updated, but the list could not refresh.");
      }

      setMessage("Banner order updated.");
    } catch (err) {
      setError(err.message || "Could not reorder banners.");
      await loadBanners();
    }
  }

  function exportBanners() {
    const blob = new Blob(
      [JSON.stringify(banners, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "braintech-banners.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return (
      <div className="banner-manager">
        <p>Loading banner manager...</p>
      </div>
    );
  }

  return (
    <main className="banner-manager">
      <div className="banner-page-heading">
        <div>
          <p className="banner-eyebrow">STORE CONTENT</p>
          <h1>Storefront Banners</h1>
          <p className="banner-muted">
            Manage promotional banners, page targeting and placement across your storefront.
          </p>
        </div>

        <div className="banner-heading-actions">
          <button
            className="banner-btn banner-btn-secondary"
            onClick={exportBanners}
          >
            Export list
          </button>

          <button
            className="banner-btn banner-btn-primary"
            onClick={openNewBanner}
          >
            + Add banner
          </button>
        </div>
      </div>

      {message && <div className="banner-notice">{message}</div>}
      {error && <div className="banner-error">{error}</div>}

      <section className="banner-stats">
        <div className="banner-stat-card">
          <span>Total banners</span>
          <strong>{banners.length}</strong>
        </div>

        <div className="banner-stat-card">
          <span>Active banners</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="banner-stat-card">
          <span>Inactive banners</span>
          <strong>{banners.length - activeCount}</strong>
        </div>
      </section>

      <section className="banner-panel">
        <div className="banner-toolbar">
          <input
            type="search"
            placeholder="Search banners..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search banners"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {filteredBanners.length === 0 ? (
          <div className="banner-empty">
            <div className="banner-empty-icon">▧</div>

            <h2>
              {banners.length
                ? "No banners match your search"
                : "No banners yet"}
            </h2>

            <p>
              Add a banner with an image, heading and optional call-to-action button.
            </p>

            {banners.length === 0 && (
              <button
                className="banner-btn banner-btn-primary"
                onClick={openNewBanner}
              >
                Create your first banner
              </button>
            )}
          </div>
        ) : (
          <div className="banner-list">
            {filteredBanners.map((banner, index) => (
              <article className="banner-item" key={banner.id}>
                <div className="banner-thumb-wrap">
                  {banner.image ? (
                    <img
                      className="banner-thumb"
                      src={banner.image}
                      alt={banner.title}
                    />
                  ) : (
                    <div className="banner-no-image">No image</div>
                  )}
                </div>

                <div className="banner-item-content">
                  <div className="banner-item-title-row">
                    <h3>{banner.title}</h3>

                    <span
                      className={`banner-status ${
                        banner.status === "Active"
                          ? "is-active"
                          : "is-inactive"
                      }`}
                    >
                      {banner.status}
                    </span>
                  </div>

                  <p>{banner.subtitle || "No subtitle added"}</p>

                  <div className="banner-item-meta">
                    <span>Page: {getPageLabel(banner.displayOn)}</span>
                    <span>Placement: {getPlacementLabel(banner.placement)}</span>
                    <span>Order: {banner.position || 1}</span>
                    <span>Button: {banner.buttonText || "None"}</span>
                    <span>Link: {banner.buttonLink || "None"}</span>
                  </div>
                </div>

                <div className="banner-item-actions">
                  <div className="banner-move-buttons">
                    <button
                      title="Move up"
                      aria-label="Move banner up"
                      disabled={index === 0}
                      onClick={() => moveBanner(banner, -1)}
                    >
                      ↑
                    </button>

                    <button
                      title="Move down"
                      aria-label="Move banner down"
                      disabled={index === filteredBanners.length - 1}
                      onClick={() => moveBanner(banner, 1)}
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    className="banner-btn banner-btn-secondary"
                    onClick={() => openEditBanner(banner)}
                  >
                    Edit
                  </button>

                  <button
                    className="banner-btn banner-btn-secondary"
                    onClick={() => toggleStatus(banner)}
                  >
                    {banner.status === "Active" ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    className="banner-btn banner-btn-danger"
                    onClick={() => deleteBanner(banner)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="banner-storage-note">
        Banner settings and uploaded images are saved on Hostinger. Choose a page and placement for each banner. The corresponding storefront placement must be connected once in the page layout.
      </p>

      {editing !== null && (
        <div
          className="banner-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <section
            className="banner-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="banner-editor-title"
          >
            <div className="banner-editor-heading">
              <div>
                <p className="banner-eyebrow">STOREFRONT CONTENT</p>

                <h2 id="banner-editor-title">
                  {editing === "new" ? "Create banner" : "Edit banner"}
                </h2>
              </div>

              <button
                className="banner-close"
                type="button"
                onClick={closeEditor}
                aria-label="Close editor"
                disabled={saving || uploading}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveBanner}>
              <div className="banner-editor-grid">
                <div className="banner-form-field banner-field-full">
                  <label htmlFor="banner-title">Banner title *</label>

                  <input
                    id="banner-title"
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="e.g. Build Your Dream Machine"
                    required
                  />
                </div>

                <div className="banner-form-field banner-field-full">
                  <label htmlFor="banner-subtitle">Subtitle</label>

                  <textarea
                    id="banner-subtitle"
                    value={form.subtitle}
                    onChange={(event) =>
                      updateField("subtitle", event.target.value)
                    }
                    placeholder="Add a short promotional message..."
                    rows={3}
                  />
                </div>

                <div className="banner-form-field banner-field-full">
                  <label>Banner image *</label>

                  <div className="banner-upload-box">
                    {form.image ? (
                      <img src={form.image} alt="Banner preview" />
                    ) : (
                      <div className="banner-upload-placeholder">
                        <span>▧</span>
                        <strong>Upload a banner image</strong>
                        <small>
                          Choose an image from your computer, up to 15 MB
                        </small>
                      </div>
                    )}

                    <label className="banner-btn banner-btn-secondary banner-file-label">
                      {uploading
                        ? "Uploading..."
                        : form.image
                          ? "Choose another image"
                          : "Choose image"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={uploading || saving}
                      />
                    </label>
                  </div>

                  <small className="banner-help">
                    Images are resized to a maximum width of 1600 px and compressed before being uploaded to Hostinger.
                  </small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-display-on">Display on</label>

                  <select
                    id="banner-display-on"
                    value={form.displayOn}
                    onChange={(event) =>
                      updateField("displayOn", event.target.value)
                    }
                  >
                    {PAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <small className="banner-help">
                    Choose which storefront page or pages should show this banner.
                  </small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-placement">Position on page</label>

                  <select
                    id="banner-placement"
                    value={form.placement}
                    onChange={(event) =>
                      updateField("placement", event.target.value)
                    }
                  >
                    {PLACEMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <small className="banner-help">
                    Choose the banner slot on the selected page.
                  </small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-button-text">Button label</label>

                  <input
                    id="banner-button-text"
                    value={form.buttonText}
                    onChange={(event) =>
                      updateField("buttonText", event.target.value)
                    }
                    placeholder="Shop Now"
                  />
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-button-link">
                    Button destination
                  </label>

                  <input
                    id="banner-button-link"
                    value={form.buttonLink}
                    onChange={(event) =>
                      updateField("buttonLink", event.target.value)
                    }
                    placeholder="/products"
                  />

                  <small className="banner-help">
                    Use an internal path beginning with /.
                  </small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-position">Display order</label>

                  <input
                    id="banner-position"
                    type="number"
                    min="1"
                    value={form.position}
                    onChange={(event) =>
                      updateField("position", event.target.value)
                    }
                  />

                  <small className="banner-help">
                    Lower numbers appear first within the same page and placement.
                  </small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-status">Status</label>

                  <select
                    id="banner-status"
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {error && <div className="banner-error">{error}</div>}
              {message && <div className="banner-notice">{message}</div>}

              {form.image && (
                <div className="banner-live-preview">
                  <span className="banner-preview-label">Preview</span>

                  <img src={form.image} alt="" />

                  <div className="banner-preview-overlay">
                    <h3>{form.title || "Your banner title"}</h3>
                    <p>{form.subtitle || "Your banner subtitle"}</p>

                    {form.buttonText && (
                      <span>{form.buttonText} ↗</span>
                    )}
                  </div>
                </div>
              )}

              <div className="banner-editor-footer">
                <button
                  type="button"
                  className="banner-btn banner-btn-secondary"
                  onClick={closeEditor}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="banner-btn banner-btn-primary"
                  disabled={saving || uploading}
                >
                  {uploading
                    ? "Uploading image..."
                    : saving
                      ? "Saving..."
                      : "Save banner"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

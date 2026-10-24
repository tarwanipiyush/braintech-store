"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

const STORAGE_KEY = "braintech-admin-banners-v1";

const emptyBanner = () => ({
  id: "",
  title: "",
  subtitle: "",
  buttonText: "Shop Now",
  buttonLink: "/products",
  image: "",
  status: "Active",
  position: 1,
});

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readImageFile(file) {
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

            const compressedReader = new FileReader();
            compressedReader.onerror = () =>
              reject(new Error("Could not prepare the image."));
            compressedReader.onload = () => resolve(compressedReader.result);
            compressedReader.readAsDataURL(blob);
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setBanners(parsed);
      }
    } catch {
      setError("Could not load saved banners from this browser.");
    } finally {
      setLoaded(true);
    }
  }, []);

  function persist(nextBanners) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBanners));
      setBanners(nextBanners);
      setMessage("Banner changes saved in this browser.");
      setError("");
      return true;
    } catch {
      setError(
        "Your browser storage is full. Try a smaller image or remove an unused banner."
      );
      return false;
    }
  }

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
      .sort((a, b) => Number(a.position || 1) - Number(b.position || 1));
  }, [banners, search, statusFilter]);

  const activeCount = banners.filter((banner) => banner.status === "Active").length;

  function openNewBanner() {
    setForm({ ...emptyBanner(), position: banners.length + 1 });
    setEditing("new");
    setMessage("");
    setError("");
  }

  function openEditBanner(banner) {
    setForm({ ...emptyBanner(), ...banner });
    setEditing(banner.id);
    setMessage("");
    setError("");
  }

  function closeEditor() {
    setEditing(null);
    setForm(emptyBanner());
    setSaving(false);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setMessage("");

    try {
      const imageData = await readImageFile(file);
      updateField("image", imageData);
      setMessage("Image selected. Save the banner to keep the change.");
    } catch (err) {
      setError(err.message || "Unable to upload this image.");
    }
  }

  function saveBanner(event) {
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

    if (form.buttonLink.trim() && !form.buttonLink.trim().startsWith("/")) {
      setError("For now, use an internal link starting with /, such as /products.");
      return;
    }

    setSaving(true);

    const id = editing === "new" ? makeId() : editing;
    const bannerToSave = {
      ...form,
      id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      buttonText: form.buttonText.trim(),
      buttonLink: form.buttonLink.trim() || "/products",
      position: Math.max(1, Number(form.position) || 1),
    };

    const next =
      editing === "new"
        ? [...banners, bannerToSave]
        : banners.map((banner) => (banner.id === id ? bannerToSave : banner));

    const saved = persist(next);

    setSaving(false);

    if (saved) closeEditor();
  }

  function toggleStatus(banner) {
    const nextStatus = banner.status === "Active" ? "Inactive" : "Active";
    persist(
      banners.map((item) =>
        item.id === banner.id ? { ...item, status: nextStatus } : item
      )
    );
  }

  function deleteBanner(banner) {
    const confirmed = window.confirm(
      `Delete the banner "${banner.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    persist(banners.filter((item) => item.id !== banner.id));
  }

  function moveBanner(banner, direction) {
    const sorted = [...banners].sort(
      (a, b) => Number(a.position || 1) - Number(b.position || 1)
    );
    const index = sorted.findIndex((item) => item.id === banner.id);
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[nextIndex];

    const currentPosition = Number(current.position || index + 1);
    const targetPosition = Number(target.position || nextIndex + 1);

    const next = banners.map((item) => {
      if (item.id === current.id) return { ...item, position: targetPosition };
      if (item.id === target.id) return { ...item, position: currentPosition };
      return item;
    });

    persist(next);
  }

  function exportBanners() {
    const exportData = banners.map(({ image, ...banner }) => ({
      ...banner,
      image: image ? "[Image stored in this browser]" : "",
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "braintech-banners.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return <div className="banner-manager"><p>Loading banner manager...</p></div>;
  }

  return (
    <main className="banner-manager">
      <div className="banner-page-heading">
        <div>
          <p className="banner-eyebrow">STORE CONTENT</p>
          <h1>Homepage Banners</h1>
          <p className="banner-muted">
            Manage the promotional banners shown on your storefront.
          </p>
        </div>

        <div className="banner-heading-actions">
          <button className="banner-btn banner-btn-secondary" onClick={exportBanners}>
            Export list
          </button>
          <button className="banner-btn banner-btn-primary" onClick={openNewBanner}>
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
            <h2>{banners.length ? "No banners match your search" : "No banners yet"}</h2>
            <p>
              Add a banner with an image, heading and optional call-to-action button.
            </p>
            {banners.length === 0 && (
              <button className="banner-btn banner-btn-primary" onClick={openNewBanner}>
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
                    <img className="banner-thumb" src={banner.image} alt={banner.title} />
                  ) : (
                    <div className="banner-no-image">No image</div>
                  )}
                </div>

                <div className="banner-item-content">
                  <div className="banner-item-title-row">
                    <h3>{banner.title}</h3>
                    <span
                      className={`banner-status ${
                        banner.status === "Active" ? "is-active" : "is-inactive"
                      }`}
                    >
                      {banner.status}
                    </span>
                  </div>
                  <p>{banner.subtitle || "No subtitle added"}</p>
                  <div className="banner-item-meta">
                    <span>Position: {banner.position || 1}</span>
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
        Note: these settings are currently saved in this browser only. They do not
        change the live homepage yet. We’ll connect banner images and settings to
        Hostinger when we build the backend.
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
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="e.g. Build Your Dream Machine"
                    required
                  />
                </div>

                <div className="banner-form-field banner-field-full">
                  <label htmlFor="banner-subtitle">Subtitle</label>
                  <textarea
                    id="banner-subtitle"
                    value={form.subtitle}
                    onChange={(event) => updateField("subtitle", event.target.value)}
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
                        <small>Choose an image from your computer, up to 15 MB</small>
                      </div>
                    )}

                    <label className="banner-btn banner-btn-secondary banner-file-label">
                      {form.image ? "Choose another image" : "Choose image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  <small className="banner-help">
                    Images are resized to a maximum width of 1600 px and compressed
                    before being stored in this browser.
                  </small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-button-text">Button label</label>
                  <input
                    id="banner-button-text"
                    value={form.buttonText}
                    onChange={(event) => updateField("buttonText", event.target.value)}
                    placeholder="Shop Now"
                  />
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-button-link">Button destination</label>
                  <input
                    id="banner-button-link"
                    value={form.buttonLink}
                    onChange={(event) => updateField("buttonLink", event.target.value)}
                    placeholder="/products"
                  />
                  <small className="banner-help">Use an internal path beginning with /.</small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-position">Display position</label>
                  <input
                    id="banner-position"
                    type="number"
                    min="1"
                    value={form.position}
                    onChange={(event) => updateField("position", event.target.value)}
                  />
                  <small className="banner-help">Lower numbers appear first in this list.</small>
                </div>

                <div className="banner-form-field">
                  <label htmlFor="banner-status">Status</label>
                  <select
                    id="banner-status"
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value)}
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
                    {form.buttonText && <span>{form.buttonText} ↗</span>}
                  </div>
                </div>
              )}

              <div className="banner-editor-footer">
                <button
                  type="button"
                  className="banner-btn banner-btn-secondary"
                  onClick={closeEditor}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="banner-btn banner-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save banner"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

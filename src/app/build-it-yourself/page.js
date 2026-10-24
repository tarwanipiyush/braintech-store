"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "@/context/CartContext";
import {
  ADDON_SLOTS,
  CORE_SLOTS,
  DISPATCH_DAYS,
  OS_OPTIONS,
  PRESETS,
  REQUIRED,
  SUPPORT_PLANS,
  analyze,
  buildLines,
  buildQuoteHtml,
  byCategory,
  emptyConfig,
  formatSize,
  fromQuery,
  hasAnything,
  hasIgpu,
  missingParts,
  money,
  optionState,
  partChips,
  powerEstimate,
  ramTotalGB,
  storageTotalGB,
  toQuery,
  totals,
} from "@/lib/builder";

const STEPS = ["Components", "Add-ons", "Review"];

/* The estimated dispatch date depends on "today", so it is only filled in on the client. */
const noopSubscribe = () => () => {};
function useDispatchDate() {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const d = new Date();
      d.setDate(d.getDate() + DISPATCH_DAYS);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    },
    () => ""
  );
}

/* ---------- small pieces ---------- */

function Qty({ value, min, max, onChange, suffix }) {
  return (
    <div className="byo-qty">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        −
      </button>
      <b>{value}</b>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
      {suffix && <small>{suffix}</small>}
    </div>
  );
}

function OptionCard({ part, selected, state, onSelect }) {
  return (
    <button
      type="button"
      className={`byo-card ${selected ? "is-selected" : ""} ${state.disabled ? "is-disabled" : ""}`}
      onClick={() => {
        if (!state.disabled) onSelect();
      }}
      aria-pressed={selected}
      aria-disabled={state.disabled}
      title={state.reason || undefined}
    >
      <span className="byo-card-img">
        <img src={part.image} alt="" loading="lazy" />
        {part.tag && <i>{part.tag}</i>}
        {selected && <em>✓</em>}
      </span>
      <b className="byo-card-name">{part.name}</b>
      <span className="byo-chips">
        {partChips(part)
          .slice(0, 4)
          .map((chip) => (
            <span key={chip} className="byo-chip">
              {chip}
            </span>
          ))}
      </span>
      <span className="byo-card-price">{money(part.price)}</span>
      {state.disabled && <small className="byo-reason">{state.reason}</small>}
    </button>
  );
}

function TextCard({ title, note, selected, disabled, reason, onSelect, icon }) {
  return (
    <button
      type="button"
      className={`byo-card byo-card-text ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      <span className="byo-text-icon">{icon}</span>
      <b className="byo-card-name">{title}</b>
      <small>{disabled && reason ? reason : note}</small>
      {selected && <em className="byo-tick">✓</em>}
    </button>
  );
}

function ServiceList({ title, hint, options, value, onChange }) {
  return (
    <section className="byo-slot">
      <header>
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
      </header>
      <div className="byo-services">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`byo-service ${value === option.key ? "is-selected" : ""}`}
            onClick={() => onChange(option.key)}
            aria-pressed={value === option.key}
          >
            <span className="byo-radio" />
            <span className="byo-service-text">
              <b>{option.name}</b>
              <small>{option.note}</small>
            </span>
            <span className="byo-service-price">{option.price ? `+ ${money(option.price)}` : "Included"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Slot({ slot, cfg, onChoose, onQty }) {
  const [open, setOpen] = useState(false);

  const value = cfg[slot.key];
  const options = byCategory(slot.category);
  const igpuBlocked = Boolean(cfg.cpu) && !hasIgpu(cfg.cpu);
  const qty = slot.qty ? cfg[slot.qty.field] : 1;
  const part = typeof value === "number" ? options.find((p) => p.id === value) : null;
  const hasChoice = value !== null && (part || value === "igpu");

  // Once something is chosen, only that choice is shown. "Change" reveals the other options.
  const collapsed = hasChoice && !open;
  const otherCount =
    options.filter((p) => p.id !== value && !optionState(slot.key, p, cfg).disabled).length +
    (slot.integrated && value !== "igpu" && !igpuBlocked ? 1 : 0) +
    (slot.optional ? 1 : 0);

  let suffix = "";
  if (slot.key === "ram" && part) suffix = `= ${formatSize(ramTotalGB(cfg))} total`;

  function pick(next) {
    onChoose(slot.key, next);
    setOpen(false);
  }

  return (
    <section className={`byo-slot ${value !== null ? "is-filled" : ""}`} id={`slot-${slot.key}`}>
      <header>
        <div>
          <h3>
            {slot.label}
            {slot.optional && <span className="byo-optional">Optional</span>}
          </h3>
          {slot.hint && <p>{slot.hint}</p>}
        </div>
        <div className="byo-slot-tools">
          {slot.qty && part && (
            <Qty value={qty} min={slot.qty.min} max={slot.qty.max} onChange={(n) => onQty(slot.qty.field, n)} suffix={suffix} />
          )}
          {value !== null && (
            <button type="button" className="byo-clear" onClick={() => pick(null)}>
              Clear
            </button>
          )}
        </div>
      </header>

      {collapsed ? (
        <div className="byo-picked">
          <span className="byo-picked-img">
            {part ? <img src={part.image} alt="" /> : <b>🖥️</b>}
            <em>✓</em>
          </span>

          <div className="byo-picked-info">
            <small>SELECTED</small>
            <b>{part ? part.name : "Integrated graphics"}</b>
            {part ? (
              <span className="byo-chips">
                {partChips(part)
                  .slice(0, 4)
                  .map((chip) => (
                    <span key={chip} className="byo-chip">
                      {chip}
                    </span>
                  ))}
              </span>
            ) : (
              <span className="byo-chips">
                <span className="byo-chip">Built into the processor</span>
              </span>
            )}
          </div>

          <div className="byo-picked-side">
            <strong>{part ? money(part.price) : "Included"}</strong>
            <button type="button" className="byo-toggle" onClick={() => setOpen(true)} aria-expanded="false">
              Change <span>▾</span>
              <small>{otherCount > 0 ? `${otherCount} other option${otherCount > 1 ? "s" : ""}` : "see all options"}</small>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="byo-options">
            {slot.integrated && (
              <TextCard
                icon="🖥️"
                title="Integrated graphics"
                note="Use the processor's built-in graphics — no card needed"
                selected={value === "igpu"}
                disabled={igpuBlocked}
                reason="Your processor has no built-in graphics"
                onSelect={() => pick("igpu")}
              />
            )}
            {slot.optional && (
              <TextCard icon="∅" title="None" note="Skip this item" selected={value === null} onSelect={() => pick(null)} />
            )}
            {options.map((option) => (
              <OptionCard
                key={option.id}
                part={option}
                selected={value === option.id}
                state={optionState(slot.key, option, cfg)}
                onSelect={() => pick(option.id)}
              />
            ))}
          </div>

          {hasChoice && (
            <button type="button" className="byo-toggle byo-toggle-hide" onClick={() => setOpen(false)} aria-expanded="true">
              Hide other options <span>▴</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- the builder ---------- */

function Builder({ initial }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const dispatch = useDispatchDate();

  const [cfg, setCfg] = useState(initial);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const builderRef = useRef(null);

  const lines = useMemo(() => buildLines(cfg), [cfg]);
  const sums = useMemo(() => totals(cfg), [cfg]);
  const checks = useMemo(() => analyze(cfg), [cfg]);
  const power = useMemo(() => powerEstimate(cfg), [cfg]);
  const missing = missingParts(cfg);
  const doneCount = REQUIRED.length - missing.length;
  const percent = Math.round((doneCount / REQUIRED.length) * 100);
  const ready = missing.length === 0;

  /* ---------- actions ---------- */

  function choose(key, value) {
    const next = { ...cfg, [key]: value };
    let message = "";
    if (key === "cpu" && next.gpu === "igpu" && value && !hasIgpu(value)) {
      next.gpu = null;
      message = "Integrated graphics was removed — that processor has none, so please pick a graphics card.";
    }
    setCfg(next);
    setNotice(message);
    setCartCount(0);
  }

  function setField(field, value) {
    setCfg({ ...cfg, [field]: value });
    setCartCount(0);
  }

  function applyFix(fix) {
    setCfg({ ...cfg, [fix.type]: fix.id });
    setNotice("");
  }

  function loadPreset(preset) {
    setCfg({ ...preset.cfg });
    setStep(0);
    setNotice(`Loaded the “${preset.label}” preset — change any part you like.`);
    setCartCount(0);
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    setCfg(emptyConfig());
    setNotice("");
    setCartCount(0);
    setShareUrl("");
    router.replace("/build-it-yourself");
  }

  function goStep(index) {
    setStep(index);
    window.setTimeout(() => builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  function jumpTo(key) {
    const isAddon = ADDON_SLOTS.some((s) => s.key === key);
    setStep(isAddon ? 1 : 0);
    window.setTimeout(() => document.getElementById(`slot-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }

  function addBuildToCart() {
    let count = 0;
    for (const line of lines) {
      if (!line.part) continue;
      for (let i = 0; i < line.qty; i += 1) {
        addToCart(line.part);
        count += 1;
      }
    }
    setCartCount(count);
  }

  function downloadQuote() {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const meta = {
      number: `BT-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      dispatch: dispatch || "to be confirmed",
    };
    const html = buildQuoteHtml(cfg, meta);
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } else {
      const blob = new Blob([html], { type: "text/html" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${meta.number}.html`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }

  function toggleShare() {
    if (shareUrl) {
      setShareUrl("");
      return;
    }
    setCopied(false);
    setShareUrl(`${window.location.origin}/build-it-yourself?${toQuery(cfg)}`);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  /* ---------- shared UI blocks ---------- */

  const actions = (
    <div className="byo-actions">
      <button type="button" className="byo-primary" disabled={!ready} onClick={addBuildToCart}>
        🛒 Add build to cart
      </button>
      {!ready && <p className="byo-missing">Still needed: {missing.join(", ")}</p>}
      <div className="byo-action-row">
        <button type="button" onClick={downloadQuote} disabled={!hasAnything(cfg)}>
          ⬇ Download quote
        </button>
        <button type="button" onClick={toggleShare} disabled={!hasAnything(cfg)} className={shareUrl ? "on" : ""}>
          🔗 Share
        </button>
        <button type="button" onClick={reset}>
          ↺ Reset
        </button>
      </div>

      {shareUrl && (
        <div className="byo-share">
          <p>Anyone with this link sees your exact configuration.</p>
          <div>
            <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label="Share link" />
            <button type="button" onClick={copyLink}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`My BrainTech PC build: ${shareUrl}`)}`} target="_blank" rel="noreferrer">
            Share on WhatsApp ↗
          </a>
        </div>
      )}

      {cartCount > 0 && (
        <div className="byo-added">
          ✓ Added {cartCount} item{cartCount > 1 ? "s" : ""} to your cart. <Link href="/cart">View cart →</Link>
        </div>
      )}
    </div>
  );

  const checksList = (
    <ul className="byo-checks">
      {checks.map((check) => (
        <li key={check.text} className={check.level}>
          <span>{check.level === "ok" ? "✓" : check.level === "warn" ? "!" : "i"}</span>
          <div>
            {check.text}
            {check.fix && (
              <button type="button" onClick={() => applyFix(check.fix)}>
                {check.fix.label}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  /* ---------- render ---------- */

  return (
    <div className="byo-page">
      {/* hero */}
      <section className="byo-hero">
        <span className="byo-orb" />
        <div className="byo-hero-copy">
          <span className="byo-kicker">NEW · BUILD IT YOURSELF</span>
          <h1>
            Configure your own PC, <em>part by part.</em>
          </h1>
          <p>
            Pick every component yourself, see compatibility and power checks update live, then add the whole build to your
            cart, download a quote or share it with a friend.
          </p>
          <div className="byo-hero-actions">
            <button type="button" className="byo-big" onClick={() => goStep(0)}>
              Configure now <span>→</span>
            </button>
            <a href="#presets" className="byo-ghost">
              Start from a preset
            </a>
          </div>
          <ul className="byo-facts">
            <li>Live compatibility check</li>
            <li>Instant price</li>
            <li>Quote &amp; share link</li>
          </ul>
        </div>
        <ol className="byo-how">
          <li>
            <b>1</b>
            <div>
              <strong>Choose components</strong>
              <small>Processor, motherboard, memory, graphics, storage, cooler, power and cabinet</small>
            </div>
          </li>
          <li>
            <b>2</b>
            <div>
              <strong>Add extras</strong>
              <small>Monitor, keyboard, mouse, headset, Windows and a support plan</small>
            </div>
          </li>
          <li>
            <b>3</b>
            <div>
              <strong>Review &amp; order</strong>
              <small>Add to cart, print a quote or share your configuration</small>
            </div>
          </li>
        </ol>
      </section>

      {/* presets */}
      <section className="byo-presets" id="presets">
        <div className="byo-section-head">
          <span className="byo-kicker">QUICK START</span>
          <h2>Not sure where to begin? Start from a preset.</h2>
        </div>
        <div className="byo-preset-grid">
          {PRESETS.map((preset) => (
            <button key={preset.key} type="button" className="byo-preset" onClick={() => loadPreset(preset)}>
              <span>{preset.emoji}</span>
              <b>{preset.label}</b>
              <small>{preset.blurb}</small>
              <em>{money(totals(preset.cfg).total)}</em>
            </button>
          ))}
        </div>
      </section>

      {/* configurator */}
      <section className="byo-layout" ref={builderRef} id="configure">
        <div className="byo-main">
          <nav className="byo-tabs" aria-label="Configurator steps">
            {STEPS.map((label, index) => (
              <button key={label} type="button" className={step === index ? "active" : ""} onClick={() => goStep(index)}>
                <span>{index + 1}</span>
                {label}
              </button>
            ))}
          </nav>

          {notice && (
            <div className="byo-notice">
              {notice}
              <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
                ✕
              </button>
            </div>
          )}

          {step === 0 && (
            <div className="byo-step">
              {CORE_SLOTS.map((slot) => (
                <Slot key={slot.key} slot={slot} cfg={cfg} onChoose={choose} onQty={setField} />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="byo-step">
              {ADDON_SLOTS.map((slot) => (
                <Slot key={slot.key} slot={slot} cfg={cfg} onChoose={choose} onQty={setField} />
              ))}
              <ServiceList
                title="Operating system"
                hint="Pick the software your PC should arrive with."
                options={OS_OPTIONS}
                value={cfg.os}
                onChange={(key) => setField("os", key)}
              />
              <ServiceList
                title="Support plan"
                hint="Choose how much help and coverage you want."
                options={SUPPORT_PLANS}
                value={cfg.support}
                onChange={(key) => setField("support", key)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="byo-step">
              <section className="byo-slot">
                <header>
                  <div>
                    <h3>Review your build</h3>
                    <p>Check every part, then add it to your cart, download a quote or share it.</p>
                  </div>
                </header>
                {lines.length === 0 ? (
                  <p className="byo-empty">Nothing selected yet. Go back to Components or load a preset.</p>
                ) : (
                  <div className="byo-table-wrap">
                    <table className="byo-table">
                      <thead>
                        <tr>
                          <th>Part</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) => (
                          <tr key={line.key}>
                            <td>{line.label}</td>
                            <td>{line.name}</td>
                            <td>{line.qty}</td>
                            <td>{line.total ? money(line.total) : "Included"}</td>
                          </tr>
                        ))}
                        <tr>
                          <td>Operating system</td>
                          <td>{sums.os.name}</td>
                          <td>1</td>
                          <td>{sums.os.price ? money(sums.os.price) : "Included"}</td>
                        </tr>
                        <tr>
                          <td>Support</td>
                          <td>{sums.support.name}</td>
                          <td>1</td>
                          <td>{sums.support.price ? money(sums.support.price) : "Included"}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3}>Total</td>
                          <td>{money(sums.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </section>
              <section className="byo-slot">
                <header>
                  <div>
                    <h3>Compatibility &amp; power</h3>
                  </div>
                </header>
                {checksList}
              </section>
              <section className="byo-slot">{actions}</section>
            </div>
          )}

          <div className="byo-step-nav">
            <button type="button" onClick={() => goStep(step - 1)} disabled={step === 0}>
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="byo-next" onClick={() => goStep(step + 1)}>
                Next: {STEPS[step + 1]} →
              </button>
            ) : (
              <span className="byo-step-hint">Last step — add your build to the cart above.</span>
            )}
          </div>
        </div>

        {/* live summary */}
        <aside className="byo-summary" aria-label="Your build summary">
          <div className="byo-sum-head">
            <h3>Your build</h3>
            <span>
              {doneCount}/{REQUIRED.length} core parts
            </span>
          </div>
          <div className="byo-progress">
            <i style={{ width: `${percent}%` }} />
          </div>

          <ul className="byo-lines">
            {CORE_SLOTS.filter((slot) => !slot.optional).map((slot) => {
              const line = lines.find((l) => l.key === slot.key);
              return (
                <li key={slot.key}>
                  <button type="button" onClick={() => jumpTo(slot.key)}>
                    <small>{slot.label}</small>
                    {line ? (
                      <>
                        <span>
                          {line.name}
                          {line.qty > 1 ? ` × ${line.qty}` : ""}
                        </span>
                        <b>{line.total ? money(line.total) : "Included"}</b>
                      </>
                    ) : (
                      <span className="byo-empty-line">Not selected yet</span>
                    )}
                  </button>
                </li>
              );
            })}
            {lines
              .filter((l) => l.key === "ssd2" || ADDON_SLOTS.some((s) => s.key === l.key))
              .map((line) => (
                <li key={line.key}>
                  <button type="button" onClick={() => jumpTo(line.key)}>
                    <small>{line.label}</small>
                    <span>
                      {line.name}
                      {line.qty > 1 ? ` × ${line.qty}` : ""}
                    </span>
                    <b>{money(line.total)}</b>
                  </button>
                </li>
              ))}
            <li className="byo-service-line">
              <small>Operating system</small>
              <span>{sums.os.name}</span>
              <b>{sums.os.price ? money(sums.os.price) : "Included"}</b>
            </li>
            <li className="byo-service-line">
              <small>Support</small>
              <span>{sums.support.name}</span>
              <b>{sums.support.price ? money(sums.support.price) : "Included"}</b>
            </li>
          </ul>

          <div className="byo-total">
            <span>Total</span>
            <b>{money(sums.total)}</b>
          </div>
          <p className="byo-fine">
            {cfg.ram ? `${formatSize(ramTotalGB(cfg))} memory` : "No memory yet"}
            {storageTotalGB(cfg) ? ` · ${formatSize(storageTotalGB(cfg))} storage` : ""}
          </p>

          {cfg.cpu && (
            <div className="byo-power">
              <div>
                <span>Estimated peak load</span>
                <b>{power.load}W</b>
              </div>
              <div className="byo-meter">
                <i
                  className={power.psu && power.psu < power.recommended ? "bad" : ""}
                  style={{ width: `${power.psu ? Math.min(100, Math.round((power.load / power.psu) * 100)) : 0}%` }}
                />
              </div>
              <small>
                {power.psu ? `Power supply: ${power.psu}W · recommended ≥ ${power.recommended}W` : `Recommended power supply: ≥ ${power.recommended}W`}
              </small>
            </div>
          )}

          {hasAnything(cfg) && checksList}

          {actions}

          {dispatch && <p className="byo-dispatch">Estimated dispatch: <b>{dispatch}</b></p>}
        </aside>
      </section>
    </div>
  );
}

/* Read a shared configuration from the link (?cpu=101&board=106…) and rebuild when it changes. */
function BuilderFromUrl() {
  const params = useSearchParams();
  const initial = useMemo(() => fromQuery((key) => params.get(key)), [params]);
  return <Builder key={params.toString()} initial={initial} />;
}

export default function BuildItYourselfPage() {
  return (
    <Suspense fallback={null}>
      <BuilderFromUrl />
    </Suspense>
  );
}
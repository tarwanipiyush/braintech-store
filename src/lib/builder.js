// Build It Yourself — configuration logic (no UI).
// Everything here works on top of the products in data/products.js.

import { products } from "@/data/products";

export const money = (value) => "₹" + new Intl.NumberFormat("en-IN").format(value);
export const getPart = (id) => products.find((p) => p.id === id) || null;
export const byCategory = (category) => products.filter((p) => p.category === category);

/* ------------------------------------------------------------------ *
 * EDIT ME — services that are not catalog products.
 * These prices / texts are placeholders: change them to match your real offer.
 * ------------------------------------------------------------------ */

export const OS_OPTIONS = [
  { key: "none", name: "No operating system", price: 0, note: "You install your own" },
  { key: "ubuntu", name: "Ubuntu Linux", price: 0, note: "Free and open source" },
  { key: "win11-home", name: "Windows 11 Home", price: 9999, note: "Genuine licence, activated" },
  { key: "win11-pro", name: "Windows 11 Pro", price: 14999, note: "Adds business and security features" },
];

export const SUPPORT_PLANS = [
  { key: "standard", name: "Standard support", price: 0, note: "Included with every build" },
  { key: "premium", name: "Premium support", price: 2999, note: "Priority help and extended coverage" },
  { key: "premium-plus", name: "Premium Plus support", price: 5999, note: "Highest priority and longest coverage" },
];

export const DISPATCH_DAYS = 5; // shown as "estimated dispatch" = today + this many days

/* ------------------------------------------------------------------ *
 * Slots (the dropdowns of the configurator)
 * ------------------------------------------------------------------ */

export const CORE_SLOTS = [
  { key: "cpu", label: "Processor", category: "Processors", hint: "The brain of your PC. It must share a socket with the motherboard." },
  { key: "board", label: "Motherboard", category: "Motherboards", hint: "Everything plugs into this. It decides which processor fits." },
  { key: "ram", label: "Memory (RAM)", category: "RAM", qty: { min: 1, max: 4, field: "ramQty" }, hint: "32GB is the sweet spot for gaming. Two modules run in faster dual-channel mode." },
  { key: "gpu", label: "Graphics card", category: "Graphic Cards", integrated: true, hint: "Draws your games and video. The biggest factor for gaming speed." },
  { key: "ssd", label: "Primary storage (NVMe SSD)", category: "SSD", hint: "Holds Windows, your games and files." },
  { key: "ssd2", label: "Secondary storage (optional)", category: "SSD", optional: true, hint: "Extra space for games, projects or backups." },
  { key: "cooler", label: "CPU cooler", category: "CPU Cooler", hint: "Keeps the processor cool so it runs at full speed." },
  { key: "psu", label: "Power supply", category: "Power Supply", hint: "Feeds every part. We check it is big enough for your build." },
  { key: "case", label: "Cabinet", category: "PC Cabinet", hint: "Holds everything together and guides airflow." },
];

export const ADDON_SLOTS = [
  { key: "monitor", label: "Monitor", category: "Monitors", optional: true, qty: { min: 1, max: 2, field: "monitorQty" }, hint: "A higher refresh rate (Hz) feels much smoother in games." },
  { key: "keyboard", label: "Keyboard", category: "Keyboards", optional: true, hint: "" },
  { key: "mouse", label: "Mouse", category: "Mouse", optional: true, hint: "" },
  { key: "headset", label: "Headset", category: "Headphones", optional: true, hint: "" },
  { key: "mousepad", label: "Mousepad", category: "Mousepad", optional: true, hint: "" },
];

export const ALL_SLOTS = [...CORE_SLOTS, ...ADDON_SLOTS];
export const REQUIRED = ["cpu", "board", "ram", "gpu", "ssd", "cooler", "psu", "case"];

export function emptyConfig() {
  return {
    cpu: null, board: null, ram: null, ramQty: 1, gpu: null, ssd: null, ssd2: null, cooler: null, psu: null, case: null,
    monitor: null, monitorQty: 1, keyboard: null, mouse: null, headset: null, mousepad: null,
    os: "none", support: "standard",
  };
}

/* ------------------------------------------------------------------ *
 * Technical facts used for compatibility (by product id)
 * ------------------------------------------------------------------ */

export const SPECS = {
  // processors — peak = approximate maximum power draw in watts
  101: { socket: "AM5", igpu: true, peak: 88, chips: ["AM5 socket", "6 cores / 12 threads", "Up to 5.1 GHz", "Built-in graphics"] },
  102: { socket: "AM5", igpu: true, peak: 120, chips: ["AM5 socket", "8 cores / 16 threads", "Up to 5.0 GHz", "3D V-Cache for gaming"] },
  103: { socket: "AM5", igpu: true, peak: 162, chips: ["AM5 socket", "12 cores / 24 threads", "Up to 5.6 GHz", "Built-in graphics"] },
  104: { socket: "LGA1700", igpu: false, peak: 148, chips: ["LGA1700 socket", "10 cores / 16 threads", "Up to 4.7 GHz", "No built-in graphics"] },
  105: { socket: "LGA1700", igpu: true, peak: 253, chips: ["LGA1700 socket", "20 cores / 28 threads", "Up to 5.6 GHz", "Built-in graphics"] },
  // motherboards
  106: { socket: "AM5", chips: ["AM5 socket", "Micro-ATX", "DDR5 memory", "Wi-Fi"] },
  107: { socket: "LGA1700", chips: ["LGA1700 socket", "Micro-ATX", "DDR5 memory"] },
  108: { socket: "AM5", chips: ["AM5 socket", "ATX", "DDR5 memory", "Wi-Fi"] },
  // graphics cards — watts = typical board power, psuRec = recommended power supply
  109: { watts: 115, psuRec: 550, chips: ["8GB memory", "115W power draw"] },
  110: { watts: 220, psuRec: 650, chips: ["12GB memory", "220W power draw"] },
  111: { watts: 263, psuRec: 700, chips: ["16GB memory", "263W power draw"] },
  112: { watts: 130, psuRec: 550, chips: ["8GB memory", "130W power draw"] },
  // coolers
  119: { chips: ["Air cooler", "Single tower"] },
  120: { chips: ["Air cooler", "RGB fan"] },
  121: { chips: ["360mm liquid cooler", "3 fans"] },
};

const COOLER_360 = 121;

export const socketOf = (id) => SPECS[id]?.socket || null;
export const hasIgpu = (id) => Boolean(SPECS[id]?.igpu);

function sizeGB(part) {
  const m = part.name.match(/(\d+)\s?(GB|TB)/i);
  if (!m) return 0;
  return m[2].toUpperCase() === "TB" ? parseInt(m[1], 10) * 1000 : parseInt(m[1], 10);
}
const psuWatts = (part) => {
  const m = part.name.match(/(\d{3,4})\s?W\b/i);
  return m ? parseInt(m[1], 10) : 0;
};
const formatSize = (gb) => (gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`);

export function partChips(part) {
  if (SPECS[part.id]?.chips) return SPECS[part.id].chips;
  const n = part.name;
  const chips = [];
  if (part.category === "RAM") chips.push(`${formatSize(sizeGB(part))}`, "DDR5");
  else if (part.category === "SSD") chips.push(formatSize(sizeGB(part)), "NVMe");
  else if (part.category === "Power Supply") {
    chips.push(`${psuWatts(part)}W`);
    const rating = n.match(/80\+\s?(\w+)/i);
    if (rating) chips.push(`80+ ${rating[1]}`);
    if (/modular/i.test(n)) chips.push("Fully modular");
  } else if (part.category === "Monitors") {
    const size = n.match(/(\d+)-inch/i);
    const res = n.match(/(FHD|QHD|QD-OLED)/i);
    const hz = n.match(/(\d+)\s?Hz/i);
    if (size) chips.push(`${size[1]}"`);
    if (res) chips.push(res[1].toUpperCase());
    if (hz) chips.push(`${hz[1]}Hz`);
  } else if (part.category === "PC Cabinet") {
    chips.push(part.tag);
  } else {
    chips.push(part.tag);
  }
  return chips.filter(Boolean);
}

/* ------------------------------------------------------------------ *
 * Option availability + compatibility checks
 * ------------------------------------------------------------------ */

// Is this option usable with what is already chosen? (processor <-> motherboard only)
export function optionState(slotKey, part, cfg) {
  if (slotKey === "cpu" && cfg.board) {
    const need = socketOf(part.id);
    const have = socketOf(cfg.board);
    if (need && have && need !== have) return { disabled: true, reason: `Needs a ${need} motherboard — yours is ${have}` };
  }
  if (slotKey === "board" && cfg.cpu) {
    const need = socketOf(cfg.cpu);
    const have = socketOf(part.id);
    if (need && have && need !== have) return { disabled: true, reason: `Your processor needs ${need} — this board is ${have}` };
  }
  return { disabled: false, reason: "" };
}

export function powerEstimate(cfg) {
  const cpuW = cfg.cpu ? SPECS[cfg.cpu]?.peak || 0 : 0;
  const gpuW = typeof cfg.gpu === "number" ? SPECS[cfg.gpu]?.watts || 0 : 0;
  const load = cpuW + gpuW + 120; // 120W for board, memory, drives and fans
  const gpuRec = typeof cfg.gpu === "number" ? SPECS[cfg.gpu]?.psuRec || 0 : 0;
  const recommended = cfg.cpu ? Math.max(Math.ceil((load * 1.25) / 50) * 50, gpuRec, 450) : 0;
  const psu = cfg.psu ? psuWatts(getPart(cfg.psu)) : 0;
  return { load, recommended, psu };
}

export function cheapestPsuFor(watts) {
  const options = byCategory("Power Supply")
    .filter((p) => psuWatts(p) >= watts)
    .sort((a, b) => a.price - b.price);
  return options[0] || null;
}

export const ramTotalGB = (cfg) => (cfg.ram ? sizeGB(getPart(cfg.ram)) * cfg.ramQty : 0);
export const storageTotalGB = (cfg) => [cfg.ssd, cfg.ssd2].reduce((sum, id) => sum + (id ? sizeGB(getPart(id)) : 0), 0);
export { formatSize };

export function missingParts(cfg) {
  const names = { cpu: "processor", board: "motherboard", ram: "memory", gpu: "graphics card", ssd: "primary storage", cooler: "CPU cooler", psu: "power supply", case: "cabinet" };
  return REQUIRED.filter((key) => !cfg[key]).map((key) => names[key]);
}

// level: ok | warn | info
export function analyze(cfg) {
  const checks = [];

  if (cfg.cpu && cfg.board) {
    checks.push({ level: "ok", text: `Processor and motherboard fit together (${socketOf(cfg.cpu)})` });
  } else {
    checks.push({ level: "info", text: "Choose a processor and motherboard — they must share a socket" });
  }

  if (cfg.board && cfg.ram) checks.push({ level: "ok", text: "Memory fits — every motherboard here uses DDR5" });

  if (cfg.ram) {
    if (cfg.ramQty === 1) checks.push({ level: "info", text: "Tip: two memory modules run in faster dual-channel mode" });
    else checks.push({ level: "ok", text: `${cfg.ramQty} memory modules (${formatSize(ramTotalGB(cfg))} total)` });
  }

  if (cfg.gpu === "igpu") {
    checks.push({ level: "info", text: "Using the processor's built-in graphics — fine for office work, light for modern games" });
  } else if (cfg.cpu && !hasIgpu(cfg.cpu) && !cfg.gpu) {
    checks.push({ level: "warn", text: "This processor has no built-in graphics — you need a graphics card to get a picture" });
  }

  const { load, recommended, psu } = powerEstimate(cfg);
  if (cfg.psu && cfg.cpu) {
    if (psu >= recommended) {
      checks.push({ level: "ok", text: `Power supply is enough (about ${load}W peak load, ${psu}W supply)` });
    } else {
      const fix = cheapestPsuFor(recommended);
      checks.push({
        level: "warn",
        text: `Power supply is too small — about ${load}W peak load, we recommend at least ${recommended}W`,
        fix: fix ? { type: "psu", id: fix.id, label: `Use ${fix.name}` } : null,
      });
    }
  }

  if (cfg.cpu && cfg.cooler && (SPECS[cfg.cpu]?.peak || 0) >= 200 && cfg.cooler !== COOLER_360) {
    checks.push({
      level: "warn",
      text: "This processor can draw over 200W — a 360mm liquid cooler keeps it from slowing down",
      fix: { type: "cooler", id: COOLER_360, label: "Use the 360mm liquid cooler" },
    });
  }
  if (cfg.cooler === COOLER_360) checks.push({ level: "info", text: "A 360mm radiator needs a cabinet that supports it — check the cabinet's specs" });

  return checks;
}

/* ------------------------------------------------------------------ *
 * Lines + totals
 * ------------------------------------------------------------------ */

export function buildLines(cfg) {
  const lines = [];
  for (const slot of ALL_SLOTS) {
    const value = cfg[slot.key];
    if (value === null || value === undefined) continue;
    if (value === "igpu") {
      lines.push({ key: slot.key, label: slot.label, name: "Integrated graphics (built into the processor)", qty: 1, unit: 0, total: 0, part: null });
      continue;
    }
    const part = getPart(value);
    if (!part) continue;
    const qty = slot.qty ? cfg[slot.qty.field] : 1;
    lines.push({ key: slot.key, label: slot.label, name: part.name, qty, unit: part.price, total: part.price * qty, part });
  }
  return lines;
}

export function totals(cfg) {
  const parts = buildLines(cfg).reduce((sum, line) => sum + line.total, 0);
  const os = OS_OPTIONS.find((o) => o.key === cfg.os) || OS_OPTIONS[0];
  const support = SUPPORT_PLANS.find((s) => s.key === cfg.support) || SUPPORT_PLANS[0];
  return { parts, services: os.price + support.price, total: parts + os.price + support.price, os, support };
}

/* ------------------------------------------------------------------ *
 * Presets
 * ------------------------------------------------------------------ */

const preset = (values) => ({ ...emptyConfig(), ...values });

export const PRESETS = [
  { key: "entry", emoji: "🎮", label: "Entry gaming", blurb: "1080p esports and everyday games", cfg: preset({ cpu: 104, board: 107, ram: 122, gpu: 112, ssd: 126, cooler: 119, psu: 116, case: 114 }) },
  { key: "mainstream", emoji: "🔥", label: "Mainstream gaming", blurb: "Smooth 1080p and capable 1440p", cfg: preset({ cpu: 101, board: 106, ram: 123, gpu: 109, ssd: 126, cooler: 119, psu: 116, case: 113 }) },
  { key: "high", emoji: "⚡", label: "High-refresh gaming", blurb: "Lots of graphics power for 1440p", cfg: preset({ cpu: 101, board: 106, ram: 123, gpu: 111, ssd: 126, cooler: 119, psu: 117, case: 113 }) },
  { key: "creator", emoji: "🎬", label: "Creator workstation", blurb: "Editing, 3D and rendering", cfg: preset({ cpu: 103, board: 108, ram: 124, gpu: 110, ssd: 127, cooler: 120, psu: 117, case: 113 }) },
  { key: "office", emoji: "💼", label: "Office & study", blurb: "Quiet and capable, no graphics card needed", cfg: preset({ cpu: 101, board: 106, ram: 122, gpu: "igpu", ssd: 125, cooler: 119, psu: 116, case: 114 }) },
];

/* ------------------------------------------------------------------ *
 * Share link <-> configuration
 * ------------------------------------------------------------------ */

const PARAM_KEYS = ["cpu", "board", "ram", "gpu", "ssd", "ssd2", "cooler", "psu", "case", "monitor", "keyboard", "mouse", "headset", "mousepad"];

export function toQuery(cfg) {
  const params = new URLSearchParams();
  for (const key of PARAM_KEYS) {
    if (cfg[key] !== null && cfg[key] !== undefined) params.set(key, String(cfg[key]));
  }
  if (cfg.ram) params.set("ramQty", String(cfg.ramQty));
  if (cfg.monitor) params.set("monitorQty", String(cfg.monitorQty));
  if (cfg.os !== "none") params.set("os", cfg.os);
  if (cfg.support !== "standard") params.set("support", cfg.support);
  return params.toString();
}

export function fromQuery(get) {
  const cfg = emptyConfig();
  for (const slot of ALL_SLOTS) {
    const raw = get(slot.key);
    if (!raw) continue;
    if (raw === "igpu" && slot.key === "gpu") {
      cfg.gpu = "igpu";
      continue;
    }
    const part = getPart(parseInt(raw, 10));
    if (part && part.category === slot.category) cfg[slot.key] = part.id;
  }
  const clamp = (value, min, max) => Math.min(max, Math.max(min, parseInt(value, 10) || min));
  cfg.ramQty = clamp(get("ramQty"), 1, 4);
  cfg.monitorQty = clamp(get("monitorQty"), 1, 2);
  if (OS_OPTIONS.some((o) => o.key === get("os"))) cfg.os = get("os");
  if (SUPPORT_PLANS.some((s) => s.key === get("support"))) cfg.support = get("support");
  // never trust a link that pairs a processor with the wrong socket
  if (cfg.cpu && cfg.board && socketOf(cfg.cpu) !== socketOf(cfg.board)) cfg.board = null;
  if (cfg.gpu === "igpu" && cfg.cpu && !hasIgpu(cfg.cpu)) cfg.gpu = null;
  return cfg;
}

export const hasAnything = (cfg) => buildLines(cfg).length > 0;

/* ------------------------------------------------------------------ *
 * Printable quote
 * ------------------------------------------------------------------ */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function buildQuoteHtml(cfg, meta) {
  const t = totals(cfg);
  const rows = buildLines(cfg)
    .map((l) => `<tr><td>${esc(l.label)}</td><td>${esc(l.name)}</td><td class="n">${l.qty}</td><td class="n">${l.unit ? money(l.unit) : "—"}</td><td class="n">${l.total ? money(l.total) : "Included"}</td></tr>`)
    .join("");
  const checks = analyze(cfg)
    .map((c) => `<li class="${c.level}">${esc(c.text)}</li>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(meta.number)} — BrainTech quote</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:40px;font-size:13px}
  h1{margin:0 0 4px;font-size:24px} .sub{color:#666;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin-top:12px} th,td{padding:9px 10px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}
  th{background:#f3f3f6;font-size:11px;text-transform:uppercase;letter-spacing:.06em} .n{text-align:right;white-space:nowrap}
  .total td{font-weight:700;border-top:2px solid #111;border-bottom:0} .brand{color:#e11d48}
  ul{padding-left:18px;color:#333} li.warn{color:#b45309} .note{margin-top:28px;color:#666;font-size:11px;line-height:1.6}
  .meta{display:flex;justify-content:space-between;margin-bottom:18px}
</style></head><body>
<h1><span class="brand">BRAIN</span>TECH — Custom PC quote</h1>
<div class="sub">PC components &amp; builds</div>
<div class="meta"><div><b>Quote no.</b> ${esc(meta.number)}</div><div><b>Date</b> ${esc(meta.date)}</div><div><b>Estimated dispatch</b> ${esc(meta.dispatch)}</div></div>
<table><thead><tr><th>Part</th><th>Product</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Total</th></tr></thead><tbody>
${rows}
<tr><td>Operating system</td><td>${esc(t.os.name)}</td><td class="n">1</td><td class="n">${t.os.price ? money(t.os.price) : "—"}</td><td class="n">${t.os.price ? money(t.os.price) : "Included"}</td></tr>
<tr><td>Support</td><td>${esc(t.support.name)}</td><td class="n">1</td><td class="n">${t.support.price ? money(t.support.price) : "—"}</td><td class="n">${t.support.price ? money(t.support.price) : "Included"}</td></tr>
<tr class="total"><td colspan="4">Total</td><td class="n">${money(t.total)}</td></tr></tbody></table>
<h3>Compatibility notes</h3><ul>${checks}</ul>
<p class="note">This quote is generated from the BrainTech demo catalog. Prices, stock and warranty must be confirmed with the seller before ordering.</p>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;
}
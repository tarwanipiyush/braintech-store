// BrainTech store assistant — the "brain".
// A guided, store-only helper: it knows our catalog, walks newbies through a PC build
// (purpose -> budget -> brand), recommends exact parts and asks before adding them to the cart.
// Pure functions only: respond(text, session) -> { replies, session, addIds }

import { products } from "@/data/products";

export const money = (value) => "₹" + new Intl.NumberFormat("en-IN").format(value);
export const getProduct = (id) => products.find((p) => p.id === id);

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const bot = (text, extra = {}) => ({ id: uid(), role: "bot", text, ...extra });
const discount = (p) => Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);

/* ------------------------------------------------------------------ *
 * Roles (what each part does, in plain English)
 * ------------------------------------------------------------------ */

export const ROLE_INFO = {
  cpu: { label: "Processor (CPU)", why: "the brain of your PC — it runs Windows, games and every program." },
  board: { label: "Motherboard", why: "the main board that every other part plugs into." },
  gpu: { label: "Graphics card (GPU)", why: "draws everything you see in games and 3D work — the biggest factor for gaming speed." },
  ram: { label: "Memory (RAM)", why: "short-term memory, so games and apps can run side by side smoothly." },
  ssd: { label: "Storage (SSD)", why: "fast storage for Windows, your games and your files." },
  psu: { label: "Power supply (PSU)", why: "feeds clean, safe power to every part." },
  cooler: { label: "CPU cooler", why: "keeps the processor cool so it can run at full speed." },
  case: { label: "Cabinet (case)", why: "holds everything together and guides airflow." },
  monitor: { label: "Monitor", why: "the screen — a higher refresh rate (Hz) feels much smoother in games." },
  mouse: { label: "Mouse", why: "your main pointing device." },
  keyboard: { label: "Keyboard", why: "for typing and game controls." },
  headset: { label: "Headset", why: "game audio plus a mic for voice chat." },
  mousepad: { label: "Mousepad", why: "a smooth surface for accurate mouse movement." },
};

const BUILD_ORDER = ["cpu", "board", "gpu", "ram", "ssd", "psu", "cooler", "case"];

/* ------------------------------------------------------------------ *
 * Curated builds (product ids from data/products.js).
 * Every set is compatible: AM5 CPU + AM5 board, DDR5 RAM, PSU sized for the GPU.
 * ------------------------------------------------------------------ */

const BUILDS = {
  gaming: [
    { key: "g-entry", name: "Entry 1080p Gaming PC", blurb: "A sensible starter rig for popular esports titles and many modern games at 1080p.", parts: { cpu: 104, board: 107, gpu: 112, ram: 122, ssd: 126, psu: 116, cooler: 119, case: 114 } },
    { key: "g-main", name: "Mainstream Gaming PC", blurb: "A balanced rig for smooth 1080p and capable 1440p gaming.", parts: { cpu: 101, board: 106, gpu: 109, ram: 123, ssd: 126, psu: 116, cooler: 119, case: 113 } },
    { key: "g-high", name: "High-Refresh 1440p Gaming PC", blurb: "A lot of graphics power for high-refresh 1440p gaming.", parts: { cpu: 101, board: 106, gpu: 111, ram: 123, ssd: 126, psu: 117, cooler: 119, case: 113 } },
    { key: "g-ultra", name: "Ultra Gaming PC", blurb: "Top-end gaming power with a gaming-focused processor, ready for 1440p and 4K.", parts: { cpu: 102, board: 108, gpu: 110, ram: 123, ssd: 126, psu: 117, cooler: 120, case: 113 } },
  ],
  creator: [
    { key: "c-entry", name: "Entry Creator PC", blurb: "Good for editing videos and learning 3D, with 32GB of RAM and a roomy 2TB drive.", parts: { cpu: 101, board: 106, gpu: 109, ram: 123, ssd: 127, psu: 116, cooler: 119, case: 113 } },
    { key: "c-pro", name: "Pro Creator PC", blurb: "A many-core processor, 64GB of RAM and a strong graphics card for serious editing, 3D and rendering.", parts: { cpu: 103, board: 108, gpu: 110, ram: 124, ssd: 127, psu: 117, cooler: 120, case: 113 } },
    { key: "c-ultra", name: "Ultra Creator Workstation", blurb: "The same power as the Pro build plus a liquid cooler, a bigger power supply and a showcase cabinet.", parts: { cpu: 103, board: 108, gpu: 110, ram: 124, ssd: 127, psu: 118, cooler: 121, case: 115 } },
  ],
  office: [
    { key: "o-basic", name: "Office & Study PC", blurb: "Quiet and capable for browsing, classes, documents and coding. No graphics card needed — the processor has basic built-in graphics.", parts: { cpu: 101, board: 106, ram: 122, ssd: 125, psu: 116, cooler: 119, case: 114 } },
    { key: "o-plus", name: "Office+ PC", blurb: "More memory and storage for heavy multitasking and light photo or video editing. Built-in graphics, so no graphics card needed.", parts: { cpu: 101, board: 106, ram: 123, ssd: 126, psu: 116, cooler: 119, case: 113 } },
  ],
};

function applyBrand(parts, brand, purpose) {
  if (brand !== "intel" || purpose === "office") return parts;
  const next = { ...parts };
  next.cpu = getProduct(parts.cpu).price >= 36000 ? 105 : 104;
  next.board = 107;
  if (next.cpu === 105 && getProduct(next.cooler).price < 11000) next.cooler = 121;
  return next;
}

function buildList(purpose, brand) {
  const base =
    purpose === "streaming"
      ? BUILDS.gaming.map((d) => ({
          ...d,
          name: d.name.replace("Gaming PC", "Gaming + Streaming PC"),
          blurb: d.blurb + " It includes 32GB of RAM, which streaming likes.",
          parts: { ...d.parts, ram: 123 },
        }))
      : BUILDS[purpose] || BUILDS.gaming;

  return base
    .map((d) => {
      const parts = applyBrand(d.parts, brand, purpose);
      const items = BUILD_ORDER.filter((role) => parts[role]).map((role) => ({ role, id: parts[role] }));
      const total = items.reduce((sum, item) => sum + getProduct(item.id).price, 0);
      return { ...d, parts, items, total };
    })
    .sort((a, b) => a.total - b.total);
}

/* ------------------------------------------------------------------ *
 * Parsing helpers
 * ------------------------------------------------------------------ */

export function parseBudget(raw, allowBare = false) {
  const t = raw.toLowerCase().replace(/,/g, "").replace(/₹/g, " ₹");
  const values = [];

  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?)\b/g)) values.push(parseFloat(m[1]) * 100000);
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*k\b/g)) values.push(parseFloat(m[1]) * 1000);
  for (const m of t.matchAll(/(?:₹|rs\.?|inr)\s*(\d{4,7})\b/g)) values.push(parseInt(m[1], 10));
  if (allowBare) {
    for (const m of t.matchAll(/\b(\d{4,7})\b(?!\s*(?:gb|tb|hz|mhz|w\b|watt|inch))/g)) values.push(parseInt(m[1], 10));
  }

  const valid = values.filter((v) => v >= 10000 && v <= 1000000);
  return valid.length ? Math.round(Math.max(...valid)) : null;
}

function detectPurpose(t) {
  if (/stream|youtuber|twitch|content creat/.test(t)) return "streaming";
  if (/video edit|editing|render|\b3d\b|animation|vfx|blender|maya|premiere|after effects|davinci|workstation|creator|photoshop|design|\bcad\b|architect/.test(t)) return "creator";
  if (/\bgam(e|es|ing|er)\b|\bfps\b|valorant|bgmi|pubg|gta|cs ?go|\bcs2\b|esports|fortnite/.test(t)) return "gaming";
  if (/office|study|student|college|school|browsing|work from home|\bwfh\b|everyday|home use|typing|excel|coding|programming|basic/.test(t)) return "office";
  return null;
}

function detectBrand(t, allowAny) {
  if (/\bintel\b|core i[3579]/.test(t)) return "intel";
  if (/\bamd\b|ryzen/.test(t)) return "amd";
  if (allowAny && /not sure|no preference|\bany\b|either|doesn'?t matter|you choose|don'?t care|dont care|whatever|surprise/.test(t)) return "any";
  return null;
}

const PURPOSE_NAME = { gaming: "gaming", streaming: "gaming + streaming", creator: "video editing / 3D", office: "office & study" };

/* ------------------------------------------------------------------ *
 * Reusable chips and prompts
 * ------------------------------------------------------------------ */

const MAIN_CHIPS = [
  { label: "🛠️ Help me build a new PC" },
  { label: "🎮 Suggest a gaming PC" },
  { label: "🎬 Video editing / 3D PC" },
  { label: "🖥️ Show monitors" },
  { label: "🔥 Today's best deals" },
  { label: "❓ What is a graphics card?" },
];

export function welcomeMessage() {
  return bot(
    "Hi! I'm the **BrainTech assistant** 👋\n\nNew to PCs? I'll ask 2–3 simple questions, recommend the exact parts you need from our store and — if you like — add them to your cart for you.\n\nI can only help with this website and its products. What would you like to do?",
    { chips: MAIN_CHIPS }
  );
}

const askPurpose = (prefix = "") =>
  bot(`${prefix}**What will you mainly use the PC for?**`, {
    chips: [{ label: "🎮 Gaming" }, { label: "📺 Gaming + streaming" }, { label: "🎬 Video editing / 3D" }, { label: "💼 Office / study" }],
  });

function askBudget(session, prefix = "") {
  const chipsByPurpose = {
    office: ["₹55,000", "₹65,000", "₹80,000"],
    creator: ["₹1 lakh", "₹1.8 lakh", "₹2 lakh"],
    default: ["₹80,000", "₹95,000", "₹1.2 lakh", "₹1.6 lakh"],
  };
  const labels = chipsByPurpose[session.purpose] || chipsByPurpose.default;
  return bot(
    `${prefix}**What's your budget for the PC itself?** A rough number is fine — for example *80000*, *95k* or *1.5 lakh*. (Monitor and keyboard come later.)`,
    { chips: labels.map((label) => ({ label: `Around ${label}` })) }
  );
}

const askBrand = (prefix = "") =>
  bot(`${prefix}**Do you prefer a processor brand?** AMD and Intel are both great — if you're not sure, I'll pick the best fit.`, {
    chips: [{ label: "AMD" }, { label: "Intel" }, { label: "Not sure — you choose" }],
  });

/* ------------------------------------------------------------------ *
 * Build proposals
 * ------------------------------------------------------------------ */

function buildMessage(next, list, index, prefix = "") {
  const b = list[index];
  const diff = next.budget ? next.budget - b.total : 0;

  let text = `${prefix}Here's my recommendation — the **${b.name}**.\n${b.blurb}\n\n**Total: ${money(b.total)}** for the PC itself (monitor, keyboard and mouse are extra).`;
  if (diff >= 8000) text += ` That leaves about ${money(diff)} of your budget — you could go faster, or add a monitor and accessories.`;
  if (diff < 0) text += ` (That's ${money(-diff)} over your budget.)`;
  text += "\n\n**Should I add all these items to your cart?**";

  next.pending = { kind: "build", ids: b.items.map((i) => i.id), total: b.total };
  next.last = { kind: "build", items: b.items, total: b.total };
  next.tier = index;

  const chips = [{ label: "✅ Yes, add all to cart" }];
  if (index > 0) chips.push({ label: "Make it cheaper" });
  if (index < list.length - 1) chips.push({ label: "Make it faster" });
  chips.push({ label: "Explain these parts" }, { label: "Start over" });

  return bot(text, { build: { title: b.name, items: b.items, total: b.total }, chips });
}

function propose(next, prefix = "") {
  const list = buildList(next.purpose, next.brand);
  const fits = list.filter((b) => b.total <= next.budget);

  let note = "";
  if (next.brand === "intel" && next.purpose === "office") {
    note = "For office use I picked the Ryzen 5 7600 — Intel's F-series chips have no built-in graphics, so they'd need an extra graphics card. ";
  }

  if (!fits.length) {
    const cheapest = list[0];
    next.tier = 0;
    next.pending = null;
    const readyMade = next.purpose === "creator" ? 154 : next.purpose === "office" ? null : 147;
    let text = `${prefix}Thanks! With **${money(next.budget)}** I can't put together a full PC from separate parts — the cheapest complete build I can make is **${money(cheapest.total)}**.`;
    if (readyMade) text += `\n\nIf you want something closer to your budget, this ready-made PC is the nearest option:`;
    const chips = [{ label: `Show the cheapest custom build (${money(cheapest.total)})` }, { label: "Change my budget" }, { label: "Start over" }];
    return [bot(text, { products: readyMade ? [readyMade] : undefined, chips })];
  }

  const index = list.indexOf(fits[fits.length - 1]);
  return [buildMessage(next, list, index, prefix + note)];
}

function advance(next, prefix = "") {
  if (!next.purpose) {
    next.step = "purpose";
    return [askPurpose(prefix)];
  }
  if (!next.budget) {
    next.step = "budget";
    return [askBudget(next, prefix)];
  }
  if (!next.brand) {
    next.step = "brand";
    return [askBrand(prefix)];
  }
  next.step = "done";
  return propose(next, prefix);
}

function explainBuild(next) {
  const items = next.last?.items;
  if (!items) return null;
  const lines = items.map(({ role, id }) => {
    const p = getProduct(id);
    return `**${ROLE_INFO[role].label}** — ${p.name} (${money(p.price)})\n${ROLE_INFO[role].why}`;
  });
  return bot(`Here's what each part does:\n\n${lines.join("\n\n")}\n\nEvery part is chosen to work together — the processor and motherboard match, the RAM is DDR5 and the power supply is sized for the graphics card.\n\n**Should I add all of them to your cart?**`, {
    chips: [{ label: "✅ Yes, add all to cart" }, { label: "Make it cheaper" }, { label: "Make it faster" }, { label: "Start over" }],
  });
}

function peripheralMessage(next) {
  const total = next.last?.total || 0;
  const items = [
    { role: "monitor", id: total < 100000 ? 140 : 141 },
    { role: "mouse", id: total < 100000 ? 129 : 128 },
    { role: "keyboard", id: total < 100000 ? 131 : 132 },
    { role: "headset", id: 134 },
    { role: "mousepad", id: 137 },
  ];
  const sum = items.reduce((s, i) => s + getProduct(i.id).price, 0);
  next.pending = { kind: "peripherals", ids: items.map((i) => i.id), total: sum };
  return bot(`Great idea — a PC needs a screen and something to control it! Here's a matching set:\n\n**Total: ${money(sum)}**\n\n**Should I add all of these to your cart too?**`, {
    build: { title: "Monitor + accessories", items, total: sum },
    chips: [{ label: "✅ Yes, add all to cart" }, { label: "No, that's all" }, { label: "Show monitors" }],
  });
}

/* ------------------------------------------------------------------ *
 * Knowledge, search and store facts
 * ------------------------------------------------------------------ */

const KNOW = [
  { key: "gpu", re: /\b(gpu|graphics? cards?|video cards?|rtx|geforce|radeon)\b/, cat: "Graphic Cards", title: "Graphics card (GPU)", text: "The graphics card draws everything you see in games and 3D or video work. For gaming it matters **more than any other part**. NVIDIA GeForce and AMD Radeon are the two brands." },
  { key: "cpu", re: /\b(cpu|processors?|ryzen|core i[3579])\b/, cat: "Processors", title: "Processor (CPU)", text: "The processor is the **brain** of your computer — it runs Windows, your games and every program. More cores and higher speed mean smoother multitasking. Ryzen (AMD) and Core (Intel) are the two brands." },
  { key: "ram", re: /\b(ram|memory|ddr5)\b/, cat: "RAM", title: "Memory (RAM)", text: "RAM is short-term memory. **16GB** is fine for basics, **32GB** is the sweet spot for gaming and multitasking, and **64GB** suits heavy editing and 3D. All our boards use DDR5." },
  { key: "ssd", re: /\b(ssd|nvme|storage|hard disk|hdd)\b/, cat: "SSD", title: "Storage (SSD)", text: "An SSD stores Windows, games and files — far faster than an old hard disk. NVMe SSDs plug straight into the motherboard. **1TB** is a comfortable start for a gaming PC." },
  { key: "psu", re: /\b(psu|power supply|smps|wattage)\b/, cat: "Power Supply", title: "Power supply (PSU)", text: "The power supply feeds every part, so don't go cheap here. The wattage must comfortably cover your graphics card, and **80+ Gold** units waste less power as heat." },
  { key: "board", re: /\b(motherboards?|mobo)\b/, cat: "Motherboards", title: "Motherboard", text: "The motherboard is the main board everything plugs into. It must match your processor's socket: **AMD Ryzen 7000/9000 → AM5 boards**, **Intel 14th Gen → LGA1700 boards**." },
  { key: "cooler", re: /\b(coolers?|cooling|aio|heatsink)\b/, cat: "CPU Cooler", title: "CPU cooler", text: "A CPU cooler stops the processor overheating. Air coolers are simple and reliable; liquid (AIO) coolers suit very powerful processors." },
  { key: "case", re: /\b(cabinets?|case|chassis|tower)\b/, cat: "PC Cabinet", title: "Cabinet (case)", text: "The cabinet holds all the parts and guides airflow. Mesh fronts keep things cooler; glass sides show off your build." },
  { key: "monitor", re: /\b(monitors?|refresh rate|hz|resolution)\b/, cat: "Monitors", title: "Monitor", text: "**Refresh rate (Hz)** is how many times per second the screen updates — 144–180Hz feels much smoother in games than 60Hz. **Resolution** is sharpness: FHD (1080p) or QHD (1440p). Match the monitor to your graphics card's power." },
];

const CATEGORY_WORDS = [
  ["Processors", /processor|\bcpu\b|ryzen|intel|core i[3579]/],
  ["Motherboards", /motherboard|mobo/],
  ["Graphic Cards", /graphic|\bgpu\b|rtx|geforce|radeon|video card/],
  ["PC Cabinet", /cabinet|\bcase\b|chassis/],
  ["Power Supply", /power supply|\bpsu\b|smps/],
  ["CPU Cooler", /cooler|cooling|\baio\b/],
  ["RAM", /\bram\b|memory|ddr5/],
  ["SSD", /\bssd\b|nvme|storage/],
  ["Mouse", /\bmouse\b|\bmice\b/],
  ["Keyboards", /keyboard/],
  ["Headphones", /headphone|headset|earphone/],
  ["Mousepad", /mousepad|mouse pad|desk mat/],
  ["Monitors", /monitor|display|screen/],
  ["Laptops", /laptop|notebook/],
  ["PC Builds", /pc build|prebuilt|pre-built|ready.?made|assembled|workstation/],
];

const STOP = new Set(
  "the and for with show find give list get need want best good top some any please products product item items buy add cart under below within less than upto max budget price cost cheap cheapest looking suggest recommend which what are you have can".split(" ")
);

function searchCatalog(t) {
  const cap = parseCap(t);
  const cats = CATEGORY_WORDS.filter(([, re]) => re.test(t)).map(([name]) => name);
  const tokens = t
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d{5,}$/.test(w) && !/^\d+(\.\d+)?k$/.test(w));
  const cheap = /cheap|lowest|affordable|value|budget/.test(t);

  let pool = cats.length ? products.filter((p) => cats.includes(p.category)) : products;
  const scored = pool
    .map((p) => {
      const hay = `${p.name} ${p.category} ${p.tag}`.toLowerCase();
      const hits = tokens.filter((tok) => hay.includes(tok)).length;
      return { p, score: hits * 2 + (cats.length ? 1 : 0) };
    })
    .filter((x) => (cats.length ? true : x.score > 0));

  if (!scored.length) return null;

  let ranked = scored;
  let capMiss = false;
  if (cap) {
    const under = scored.filter((x) => x.p.price <= cap);
    if (under.length) ranked = under;
    else capMiss = true;
  }

  ranked.sort((a, b) => b.score - a.score || (cheap || capMiss ? a.p.price - b.p.price : b.p.rating - a.p.rating));
  return { items: ranked.slice(0, 4).map((x) => x.p), cats, cap, capMiss };
}

function parseCap(t) {
  const m = t
    .replace(/,/g, "")
    .match(/(?:under|below|within|less than|upto|up to|max(?:imum)?|around|budget(?: of| is)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|k)?\b/);
  if (!m) return null;
  let value = parseFloat(m[1]);
  if (m[2]) value *= /^l/.test(m[2]) ? 100000 : 1000;
  return value >= 300 ? Math.round(value) : null;
}

const SHOW_CHIPS = [{ label: "🛠️ Help me build a new PC" }, { label: "🔥 Today's best deals" }, { label: "🖥️ Show monitors" }];

const isYes = (t) =>
  /^(yes|yeah|yep|yup|y|sure|ok|okay|please|go ahead|do it|confirm|add)\b/.test(t) ||
  /(add (them|all|it|everything)|yes,? add|add all|add to (my )?cart)/.test(t);
const isNo = (t) => /^(no|nope|nah|not now|later|cancel|skip|don'?t|never ?mind|nothing)\b/.test(t);

/* ------------------------------------------------------------------ *
 * The conversation engine
 * ------------------------------------------------------------------ */

export function createSession() {
  return { step: "idle", purpose: null, budget: null, brand: null, tier: null, pending: null, last: null };
}

export function respond(input, session) {
  const text = input.trim();
  const t = text.toLowerCase().replace(/^[^a-z0-9₹]+/, "");
  const next = { ...session };
  const done = (replies, addIds = []) => ({ replies: Array.isArray(replies) ? replies : [replies], session: next, addIds });

  const flowActive = ["purpose", "budget", "brand"].includes(next.step);

  /* 1. start over */
  if (/^(start over|new chat|reset|restart|clear)\b/.test(t)) {
    Object.assign(next, createSession());
    next.step = "purpose";
    return done(askPurpose("Sure, let's start fresh. "));
  }

  /* 2. answering a pending "should I add these to your cart?" */
  if (next.pending) {
    const pending = next.pending;
    if (isYes(t)) {
      if (pending.kind === "products" && !/\ball\b|everything|them/.test(t)) {
        return done(bot("Which one would you like? Tap **Add to cart** on the item, or say **add all** to add every product shown.", { chips: [{ label: "Add all to cart" }, { label: "No, thanks" }] }));
      }
      next.pending = null;
      const count = pending.ids.length;
      const base = `Done! ✅ I added **${count} item${count > 1 ? "s" : ""}** (${money(pending.total)}) to your cart.`;
      if (pending.kind === "build") {
        return done(
          bot(`${base}\n\nTip: you'll still need a monitor, keyboard and mouse. Want me to suggest a matching set?`, {
            chips: [{ label: "🖥️ Suggest a monitor & keyboard set" }, { label: "Open cart", href: "/cart" }, { label: "No, that's all" }],
          }),
          pending.ids
        );
      }
      return done(bot(`${base}\n\nAnything else I can help with?`, { chips: [{ label: "Open cart", href: "/cart" }, { label: "🛠️ Help me build a new PC" }, { label: "🔥 Today's best deals" }] }), pending.ids);
    }
    if (isNo(t)) {
      next.pending = null;
      const wasBuild = pending.kind === "build";
      return done(
        bot(wasBuild ? "No problem — nothing was added. Would you like a cheaper or faster version, or should we start over?" : "No problem, nothing was added. Is there anything else I can help you find?", {
          chips: wasBuild ? [{ label: "Make it cheaper" }, { label: "Make it faster" }, { label: "Change my budget" }, { label: "Start over" }] : SHOW_CHIPS,
        })
      );
    }
  }

  /* 3. build-related shortcuts (chips) */
  if (/make it cheaper|cheaper (one|build|option)|more affordable/.test(t) || /make it faster|more powerful|faster build|upgrade it|better build/.test(t)) {
    if (next.purpose && next.tier !== null) {
      const faster = !/cheaper|affordable/.test(t);
      const list = buildList(next.purpose, next.brand);
      const index = next.tier + (faster ? 1 : -1);
      if (index < 0 || index >= list.length) {
        return done(bot(faster ? "That's already the most powerful custom build I have for this use. 💪 Want me to add it to your cart?" : "That's already the most affordable custom build I can make for this use.", {
          chips: [{ label: "✅ Yes, add all to cart" }, { label: "Change my budget" }, { label: "Start over" }],
        }));
      }
      return done(buildMessage(next, list, index, faster ? "Sure — here's a more powerful option. " : "Sure — here's a more affordable option. "));
    }
  }

  if (/cheapest custom build/.test(t) && next.purpose) {
    const list = buildList(next.purpose, next.brand);
    next.budget = list[0].total;
    return done(propose(next, "Here you go. "));
  }

  if (/(change|increase|raise|new|different) (my )?budget/.test(t)) {
    next.budget = null;
    if (!next.purpose) return done(advance(next));
    next.step = "budget";
    return done(askBudget(next, "No problem. "));
  }

  if (/explain (these |the )?parts|why (these|this)/.test(t)) {
    const message = explainBuild(next);
    if (message) return done(message);
  }

  if (/monitor (&|and) keyboard set|peripherals?|suggest (a )?(matching )?(set|accessor)/.test(t) && next.last) {
    return done(peripheralMessage(next));
  }

  /* 4. guided flow — capture what the visitor tells us */
  const explicitBuild =
    /\b(build|assemble|put together|from scratch|new pc|new computer|first pc|first computer|newbie|beginner|noob|no idea|nothing about)\b|don'?t know (anything|how|much)/.test(t);
  const softBuild =
    /(make|create|buy|get|need|want|suggest|recommend|guide|help|plan|set ?up)[^.?!]*\b(pc|computer|desktop|rig|system|setup)\b|\b(gaming|editing|streaming|office|workstation|creator)\s+(pc|computer|desktop|rig)\b/.test(t);
  // brand words alone (intel / amd / ryzen) should not turn a build request into a product search
  const categoryMention = CATEGORY_WORDS.some(([, re]) => re.test(t.replace(/\b(intel|amd|ryzen|core i[3579])\b/g, " ")));
  const startsBuild = explicitBuild || (!categoryMention && softBuild);
  const readyMade = /ready.?made|pre.?built|assembled pc|ready to use|already built/.test(t);

  const purposeOnly = detectPurpose(t) && t.split(/\s+/).length <= 6 && !categoryMention;
  const explainAsk = /(what('s| is| are)|explain|tell me about|meaning of|define|do i need|what does|difference between|how does)/.test(t);

  if (flowActive || ((startsBuild || purposeOnly) && !readyMade && !(explainAsk && !flowActive))) {
    if (!flowActive) {
      Object.assign(next, createSession());
    }
    const prevPurpose = next.purpose;
    const purpose = detectPurpose(t);
    const budget = parseBudget(t, next.step === "budget");
    const brand = detectBrand(t, next.step === "brand");

    if (purpose) next.purpose = purpose;
    if (budget) next.budget = budget;
    if (brand) next.brand = brand;
    if (purpose && prevPurpose && purpose !== prevPurpose) next.tier = null;

    const captured = [];
    if (purpose) captured.push(`**${PURPOSE_NAME[purpose]}** PC`);
    if (budget) captured.push(`a budget of **${money(budget)}**`);
    if (brand) captured.push(brand === "any" ? "no brand preference" : `**${brand === "intel" ? "Intel" : "AMD"}** processor`);

    if (captured.length) {
      return done(advance(next, `Got it — ${captured.join(", ")}. `));
    }
    if (!flowActive) {
      return done(advance(next, "Happy to help you build one! 🛠️ "));
    }
    // Still in the flow but we could not read an answer — unless they asked something else, re-ask.
    const looksLikeOtherIntent = explainAsk || CATEGORY_WORDS.some(([, re]) => re.test(t)) || /deal|offer|cart|help|warranty|delivery/.test(t);
    if (!looksLikeOtherIntent) {
      const hint =
        next.step === "budget"
          ? "I couldn't read a budget from that — please type a number like *80000*, *95k* or *1.5 lakh*."
          : next.step === "brand"
          ? "Please pick AMD, Intel or *Not sure* and I'll take it from there."
          : "Please pick what the PC is mainly for.";
      const replies = advance(next, `${hint}\n\n`);
      return done(replies);
    }
  }

  /* 5. general intents */
  if (/^(hi+|hello+|hey+|hlo|namaste|yo|good (morning|afternoon|evening))\b/.test(t) && t.split(/\s+/).length <= 4) {
    return done(bot("Hello! 👋 How can I help you today?", { chips: MAIN_CHIPS }));
  }
  if (/^(thanks|thank you|thx|ty|great|awesome|perfect|nice)\b/.test(t)) {
    return done(bot("You're welcome! 😊 Anything else I can help you with?", { chips: MAIN_CHIPS.slice(0, 4) }));
  }
  if (/^(bye|goodbye|see you|that'?s all)\b/.test(t)) {
    return done(bot("Happy building! I'm right here whenever you need help. 👋", { chips: [{ label: "Open cart", href: "/cart" }] }));
  }
  if (/^(help|what can you do|options|menu|who are you|what are you)\b/.test(t)) {
    return done(bot("I'm the BrainTech store assistant. I can:\n\n• **Guide you through building a PC** step by step\n• **Recommend exact parts** from our store and add them to your cart\n• **Explain PC terms** in simple words\n• **Find products** by type or price — e.g. *monitors under 20000*\n• **Show deals** and ready-made PCs\n\nI only cover this website and its products.", { chips: MAIN_CHIPS }));
  }
  if (/(view|show|open|go to|see|check) (my )?cart|checkout|check out|my cart/.test(t)) {
    return done(bot("Your cart is one tap away. 🛒", { chips: [{ label: "Open cart", href: "/cart" }, { label: "🛠️ Help me build a new PC" }] }));
  }

  if (/deal|offer|discount|sale|price drop/.test(t)) {
    const ids = [...products].sort((a, b) => discount(b) - discount(a)).slice(0, 4).map((p) => p.id);
    next.pending = { kind: "products", ids, total: ids.reduce((s, id) => s + getProduct(id).price, 0) };
    return done(bot("Here are our biggest price drops right now (demo catalog prices). Tap **Add to cart** on any item, or say **add all**.", { products: ids, chips: SHOW_CHIPS }));
  }

  if (readyMade) {
    const ids = [147, 146, 155, 150];
    next.pending = { kind: "products", ids, total: ids.reduce((s, id) => s + getProduct(id).price, 0) };
    return done(bot("Here are some ready-made PCs, from entry level to powerful. Tap **Add to cart** on the one you like. If you tell me your budget and use, I can also build a custom PC part by part.", { products: ids, chips: [{ label: "🛠️ Help me build a new PC" }, { label: "🔥 Today's best deals" }] }));
  }

  if (/deliver|shipping|\bship\b|warranty|guarantee|return policy|refund|payment|\bemi\b|\bcod\b|cash on|contact|support|in stock/.test(t)) {
    return done(bot("Here's what I can tell you from the store: **shipping options are shown at checkout**, and **warranty follows each product's terms**. This is a demo catalog, so please verify the final price, stock and warranty with the seller before ordering. I don't have payment, EMI or return-policy details — please check at checkout.", { chips: [{ label: "Open cart", href: "/cart" }, ...SHOW_CHIPS.slice(0, 2)] }));
  }

  if (/compatib|work with|will .* fit|socket|\bam5\b|lga ?1700|which (motherboard|board)/.test(t)) {
    const ids = [106, 108, 107];
    return done(bot("Quick compatibility guide:\n\n• **AMD Ryzen 7000/9000** processors use **AM5** boards — MSI B650M Gaming WiFi or ASUS TUF B650-Plus WiFi.\n• **Intel Core 14th Gen** processors use **LGA1700** boards — Gigabyte B760M DS3H.\n• All our boards use **DDR5** memory.\n• The power supply must cover your graphics card.\n\nWhen I build a PC for you, I always pick parts that fit together.", { products: ids, chips: [{ label: "🛠️ Help me build a new PC" }] }));
  }

  /* explain a part */
  if (explainAsk) {
    const hits = KNOW.filter((k) => k.re.test(t)).slice(0, 2);
    if (hits.length) {
      const body = hits.map((k) => `**${k.title}**\n${k.text}`).join("\n\n");
      const ids = hits
        .flatMap((k) => products.filter((p) => p.category === k.cat).sort((a, b) => b.rating - a.rating).slice(0, 2))
        .map((p) => p.id);
      return done(bot(`${body}\n\nHere are some from our store:`, { products: ids, chips: [{ label: "🛠️ Help me build a new PC" }, { label: `Show ${hits[0].cat}` }] }));
    }
  }

  if ((isYes(t) || isNo(t)) && t.split(/\s+/).length <= 3) {
    return done(bot("Sure! What would you like to do?", { chips: MAIN_CHIPS }));
  }

  if (explainAsk && /\b(pc|computer|desktop)\b/.test(t)) {
    return done(bot("A **PC (desktop computer)** is built from a few key parts: a **processor** (the brain), a **graphics card** (draws games and video), **RAM** (short-term memory), an **SSD** (storage), a **motherboard** that connects them, a **power supply**, a **cooler** and a **cabinet**. A *gaming PC* simply puts more money into the graphics card and processor.\n\nNew to this? I can pick every part for you.", {
      chips: [{ label: "🛠️ Help me build a new PC" }, { label: "❓ What is a graphics card?" }, { label: "🔥 Today's best deals" }],
    }));
  }

  /* product search */
  const result = searchCatalog(t);
  if (result) {
    const ids = result.items.map((p) => p.id);
    next.pending = { kind: "products", ids, total: result.items.reduce((s, p) => s + p.price, 0) };
    const label = result.cats.length ? result.cats.join(" / ") : "matches";
    let head = `Here are some **${label}** from our store`;
    if (result.cap && !result.capMiss) head += ` under ${money(result.cap)}`;
    if (result.capMiss) head = `I couldn't find **${label}** under ${money(result.cap)} — here are the most affordable ones`;
    return done(bot(`${head}. Tap **Add to cart** on any item, or say **add all**.`, { products: ids, chips: SHOW_CHIPS }));
  }

  /* not found / out of scope */
  const storeish = /\bpc\b|computer|gaming|price|cost|buy|order|product|store|website|part|component|build|shop|laptop/.test(t);
  if (storeish) {
    return done(bot("I couldn't find that in our catalog. Try a product type like *monitors*, *RTX 4060* or *gaming mouse under 3000* — or let me guide you through a build.", { chips: MAIN_CHIPS.slice(0, 4) }));
  }
  return done(bot("I can only help with the BrainTech store — choosing PC parts, planning a build and finding products on this website, so I can't help with that one. 🙂\n\nWhat would you like to do?", { chips: MAIN_CHIPS }));
}

 // Starter demo catalog for the BrainTech Store UI.
// These products and prices are illustrative. Verify hardware, pricing,
// compatibility, availability, and warranty before accepting orders.

const images = {
  pc: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=85",
  gpu: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85",
  cpu: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=85",
  board: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85",
  case: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=85",
  cooler: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=85",
  ram: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=85",
  ssd: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=85",
  mouse: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85",
  headset: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=900&q=85",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
  pad: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=85",
  psu: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=85",
};

const seed = [
  // Existing products: 101-148
  [101, "AMD Ryzen 5 7600 Desktop Processor", "Processors", 18999, 22999, "cpu", "Bestseller", "6-core desktop CPU concept for gaming and everyday creation."],
  [102, "AMD Ryzen 7 7800X3D Gaming Processor", "Processors", 36999, 42999, "cpu", "Gaming pick", "High-performance CPU concept for gaming-focused builds."],
  [103, "AMD Ryzen 9 9900X Processor", "Processors", 44999, 51999, "cpu", "Creator choice", "A powerful multi-core processor concept for demanding workloads."],
  [104, "Intel Core i5-14400F Processor", "Processors", 17999, 21999, "cpu", "Popular", "Balanced desktop processor concept for gaming and work."],
  [105, "Intel Core i7-14700K Processor", "Processors", 38999, 44999, "cpu", "Performance", "High-performance CPU concept for advanced desktop builds."],
  [106, "MSI B650M Gaming WiFi Motherboard", "Motherboards", 13999, 16999, "board", "Popular", "AMD AM5 motherboard concept with modern connectivity."],
  [107, "Gigabyte B760M DS3H DDR5 Motherboard", "Motherboards", 11999, 14999, "board", "Value pick", "Intel platform motherboard concept for compact builds."],
  [108, "ASUS TUF Gaming B650-Plus WiFi", "Motherboards", 21999, 25999, "board", "Enthusiast", "Feature-rich motherboard concept for a premium AMD setup."],
  [109, "GeForce RTX 4060 8GB Graphics Card", "Graphic Cards", 29999, 34999, "gpu", "Bestseller", "Graphics card concept for 1080p gaming and creative applications."],
  [110, "GeForce RTX 4070 Super 12GB Graphics Card", "Graphic Cards", 62999, 69999, "gpu", "Performance", "Higher-tier graphics card concept for high-refresh gaming."],
  [111, "Radeon RX 7800 XT 16GB Graphics Card", "Graphic Cards", 49999, 56999, "gpu", "Hot pick", "Graphics card concept with generous memory for modern games."],
  [112, "GeForce RTX 3050 8GB Graphics Card", "Graphic Cards", 21999, 25999, "gpu", "Value pick", "Entry-level graphics upgrade concept for gaming PCs."],
  [113, "Cooler Master MasterBox Airflow Mid Tower", "PC Cabinet", 6499, 7999, "case", "Airflow", "Mid-tower cabinet concept with a mesh front panel."],
  [114, "ANTEC VX310 ARGB Gaming Cabinet", "PC Cabinet", 4999, 6499, "case", "RGB", "ARGB cabinet concept for a colourful gaming setup."],
  [115, "Lian Li O11 Dynamic Style Cabinet", "PC Cabinet", 12999, 15999, "case", "Premium", "Showcase cabinet concept with a dual-chamber layout."],
  [116, "Cooler Master MWE 650W 80+ Bronze PSU", "Power Supply", 5499, 6999, "psu", "Reliable", "650W power supply concept for mainstream gaming builds."],
  [117, "Corsair RM750e 750W 80+ Gold PSU", "Power Supply", 9999, 11999, "psu", "Gold rated", "Fully modular power supply concept for a clean build."],
  [118, "Cooler Master 850W Gold Modular PSU", "Power Supply", 11999, 13999, "psu", "Upgrade pick", "Higher-wattage modular PSU concept for powerful components."],
  [119, "DeepCool AK400 CPU Air Cooler", "CPU Cooler", 2499, 3299, "cooler", "Popular", "Compact tower air cooler concept for everyday performance."],
  [120, "Cooler Master Hyper 212 Spectrum V3", "CPU Cooler", 2999, 3999, "cooler", "RGB", "Single-tower CPU cooler concept with RGB lighting."],
  [121, "Arctic Liquid Freezer III 360 AIO", "CPU Cooler", 11999, 14999, "cooler", "Premium", "360mm liquid cooler concept for high-performance CPUs."],
  [122, "Corsair Vengeance 16GB DDR5 RAM", "RAM", 4499, 5499, "ram", "Value pick", "16GB DDR5 memory kit concept for modern desktop systems."],
  [123, "Adata XPG Lancer Blade 32GB DDR5 RAM", "RAM", 7999, 9999, "ram", "Bestseller", "32GB DDR5 memory kit concept for gaming and multitasking."],
  [124, "Kingston Fury Beast 64GB DDR5 RAM", "RAM", 15999, 18999, "ram", "Creator choice", "High-capacity DDR5 memory concept for heavy workloads."],
  [125, "Kingston NV3 500GB NVMe SSD", "SSD", 2999, 3999, "ssd", "Value pick", "Compact NVMe storage concept for OS and essential apps."],
  [126, "WD Blue SN580 1TB NVMe SSD", "SSD", 5999, 7499, "ssd", "Bestseller", "1TB NVMe storage concept for games and projects."],
  [127, "Samsung 990 EVO 2TB NVMe SSD", "SSD", 12999, 15999, "ssd", "Fast storage", "High-capacity NVMe storage concept for demanding users."],
  [128, "Logitech G502 Gaming Mouse", "Mouse", 3999, 4999, "mouse", "Popular", "Ergonomic gaming mouse concept with configurable controls."],
  [129, "Razer DeathAdder Essential Mouse", "Mouse", 1499, 1999, "mouse", "Value pick", "Lightweight wired gaming mouse concept for everyday play."],
  [130, "Wireless Precision Productivity Mouse", "Mouse", 2499, 3299, "mouse", "Work setup", "Wireless mouse concept for productivity and daily use."],
  [131, "Mechanical RGB Gaming Keyboard", "Keyboards", 3499, 4499, "keyboard", "RGB", "Mechanical keyboard concept with customizable backlighting."],
  [132, "Tenkeyless Hot-Swap Mechanical Keyboard", "Keyboards", 5999, 7499, "keyboard", "Enthusiast", "Compact keyboard concept for a flexible desk setup."],
  [133, "Wireless Multi-Device Keyboard", "Keyboards", 2299, 2999, "keyboard", "Productivity", "Wireless keyboard concept for work and study."],
  [134, "HyperX Cloud Stinger Gaming Headset", "Headphones", 3499, 4499, "headset", "Gaming pick", "Over-ear headset concept for gaming and voice chat."],
  [135, "Studio Monitoring Headphones", "Headphones", 6999, 8999, "headset", "Creator choice", "Closed-back headphone concept for editing and focused listening."],
  [136, "Wireless Gaming Headset with Mic", "Headphones", 5999, 7999, "headset", "Wireless", "Wireless headset concept for a clean gaming setup."],
  [137, "Extended RGB Desk Mousepad", "Mousepad", 999, 1499, "pad", "Setup essential", "Large desk mat concept for mouse movement and desk protection."],
  [138, "Control Surface XL Gaming Mousepad", "Mousepad", 699, 999, "pad", "Value pick", "Smooth extended mousepad concept for low-friction movement."],
  [139, "Gigabyte M27F 27-inch FHD 165Hz Monitor", "Monitors", 19079, 28500, "monitor", "Monitor deal", "27-inch IPS gaming monitor concept with a high refresh rate."],
  [140, "Gigabyte GS27FC 27-inch FHD 180Hz Monitor", "Monitors", 12999, 17999, "monitor", "Hot pick", "Curved gaming monitor concept for high-refresh play."],
  [141, "27-inch QHD 165Hz IPS Gaming Monitor", "Monitors", 21999, 27999, "monitor", "Sharp visuals", "QHD monitor concept for detailed gaming and productivity."],
  [142, "Gigabyte Aorus FO27Q2 QD-OLED 240Hz Monitor", "Monitors", 62365, 168000, "monitor", "Premium", "High-refresh OLED monitor concept for enthusiasts."],
  [143, "Performance Laptop 15-inch RTX Graphics", "Laptops", 84999, 94999, "laptop", "Portable power", "Gaming laptop concept for portable performance."],
  [144, "Creator Laptop 16-inch High-Resolution Display", "Laptops", 99999, 114999, "laptop", "Creator choice", "Creator laptop concept for editing and design workflows."],
  [145, "NeroX MY8 Custom Rendering PC", "PC Builds", 95799, 103763, "pc", "Creator build", "Illustrative custom workstation build with discrete graphics."],
  [146, "Gaming & Streaming PC — Ryzen Edition", "PC Builds", 74999, 84999, "pc", "Bestseller", "Gaming desktop concept for streaming and competitive play."],
  [147, "Entry Gaming PC — RTX 3050 Edition", "PC Builds", 48371, 62169, "pc", "Value build", "Starter desktop build concept for gaming and general use."],
  [148, "Maya Rendering Workstation — RTX 5080 Class", "PC Builds", 249999, 279999, "pc", "Workstation", "High-end workstation concept for rendering-heavy workflows."],

  // Gaming & Streaming PC: 5 products
  [149, "Gaming & Streaming PC — Ryzen 5 RTX 4060", "PC Builds", 74999, 84999, "pc", "Gaming Build", "Gaming PC concept for competitive gaming and entry-level streaming."],
  [150, "Gaming & Streaming PC — Ryzen 7 RTX 4070 Super", "PC Builds", 129999, 144999, "pc", "Streamer Pick", "Gaming and streaming PC concept for high-refresh gameplay."],
  [151, "Gaming & Streaming PC — Intel Core i5 RTX 4060", "PC Builds", 79999, 89999, "pc", "Intel Gaming", "Intel-based gaming PC concept for gaming and live broadcasts."],
  [152, "Gaming & Streaming PC — Ryzen 7 RX 7800 XT", "PC Builds", 119999, 134999, "pc", "AMD Gaming", "AMD gaming PC concept for high-resolution gameplay and streaming."],
  [153, "Gaming & Streaming PC — Ryzen 9 RTX 4080 Class", "PC Builds", 199999, 224999, "pc", "Enthusiast", "Premium gaming and streaming workstation concept."],

  // Video Editing PC: 5 products
  [154, "Video Editing PC — Ryzen 5 32GB Creator", "PC Builds", 79999, 89999, "pc", "Creator Entry", "Video editing PC concept for Full HD editing and creator work."],
  [155, "Video Editing PC — Intel Core i7 RTX 4060", "PC Builds", 109999, 124999, "pc", "Editing Pick", "Editing workstation concept for timelines, effects and multitasking."],
  [156, "Video Editing PC — Ryzen 7 RTX 4070 Super", "PC Builds", 149999, 164999, "pc", "4K Editing", "Creator PC concept for demanding 4K editing projects."],
  [157, "Video Editing PC — Intel Core i7 64GB Creator", "PC Builds", 139999, 154999, "pc", "Multitasking", "Editing PC concept for large projects and multiple applications."],
  [158, "Video Editing PC — Ryzen 9 RTX 4080 Class", "PC Builds", 229999, 254999, "pc", "Pro Creator", "High-performance video production workstation concept."],

  // 3D Generalist PC: 5 products
  [159, "3D Generalist PC — Ryzen 5 RTX 4060", "PC Builds", 89999, 99999, "pc", "3D Starter", "3D workstation concept for modelling, texturing and previews."],
  [160, "3D Generalist PC — Ryzen 7 RTX 4070 Super", "PC Builds", 149999, 164999, "pc", "3D Creator", "3D workstation concept for modelling, rendering and animation."],
  [161, "3D Generalist PC — Intel Core i7 RTX 4070", "PC Builds", 154999, 169999, "pc", "Studio Work", "3D workstation concept for creative studio workflows."],
  [162, "3D Generalist PC — Ryzen 9 64GB Creator", "PC Builds", 179999, 199999, "pc", "Heavy Scenes", "Workstation concept for complex scenes and multitasking."],
  [163, "3D Generalist PC — Ryzen 9 RTX 5080 Class", "PC Builds", 279999, 309999, "pc", "Advanced 3D", "High-end 3D workstation concept for demanding rendering."],

  // Architectural PC: 5 products
  [164, "Architectural PC — Ryzen 5 Design Workstation", "PC Builds", 84999, 94999, "pc", "Architecture Entry", "Architecture workstation concept for CAD drawings and design."],
  [165, "Architectural PC — Intel Core i7 CAD Build", "PC Builds", 119999, 134999, "pc", "CAD Workstation", "Design PC concept for architectural drafting and models."],
  [166, "Architectural PC — Ryzen 7 RTX 4070", "PC Builds", 149999, 164999, "pc", "3D Visualization", "Architecture PC concept for 3D visualization and presentations."],
  [167, "Architectural PC — Ryzen 9 64GB Workstation", "PC Builds", 189999, 209999, "pc", "Studio Architect", "Workstation concept for large architectural models."],
  [168, "Architectural PC — Ryzen 9 RTX 5080 Class", "PC Builds", 289999, 319999, "pc", "Visualization Pro", "High-performance architectural visualization workstation concept."],

  // 3D Modelling PC: 5 products
  [169, "3D Modelling PC — Ryzen 5 RTX 4060", "PC Builds", 89999, 99999, "pc", "Modelling Starter", "3D modelling PC concept for basic sculpting and viewport work."],
  [170, "3D Modelling PC — Intel Core i5 RTX 4060", "PC Builds", 94999, 104999, "pc", "Design Essential", "Modelling workstation concept for CAD and creative projects."],
  [171, "3D Modelling PC — Ryzen 7 RTX 4070 Super", "PC Builds", 149999, 164999, "pc", "Modeller Pick", "3D workstation concept for detailed assets and larger scenes."],
  [172, "3D Modelling PC — Intel Core i7 64GB", "PC Builds", 159999, 174999, "pc", "Complex Models", "Workstation concept for complex geometry and multitasking."],
  [173, "3D Modelling PC — Ryzen 9 RTX 5080 Class", "PC Builds", 279999, 309999, "pc", "Pro Modelling", "Advanced workstation concept for demanding modelling and rendering."],

  // VFX Animation PC: 5 products
  [174, "VFX Animation PC — Ryzen 5 RTX 4060", "PC Builds", 99999, 109999, "pc", "VFX Starter", "VFX workstation concept for learning compositing and basic animation."],
  [175, "VFX Animation PC — Intel Core i7 RTX 4070", "PC Builds", 154999, 169999, "pc", "Animation Pick", "Animation PC concept for scene work, effects and previews."],
  [176, "VFX Animation PC — Ryzen 7 RTX 4070 Super", "PC Builds", 164999, 179999, "pc", "Effects Studio", "Workstation concept for animation, simulations and visual effects."],
  [177, "VFX Animation PC — Ryzen 9 64GB RTX 4080 Class", "PC Builds", 239999, 264999, "pc", "VFX Creator", "High-performance VFX workstation concept for heavier scenes."],
  [178, "VFX Animation PC — Ryzen 9 RTX 5080 Class", "PC Builds", 299999, 329999, "pc", "VFX Professional", "Premium workstation concept for demanding animation and effects."],

  // Compositing PC: 5 products
  [179, "Compositing PC — Ryzen 5 32GB Creator", "PC Builds", 84999, 94999, "pc", "Compositing Entry", "Compositing PC concept for basic node-based workflows."],
  [180, "Compositing PC — Intel Core i7 RTX 4060", "PC Builds", 119999, 134999, "pc", "Compositor Pick", "Workstation concept for layered compositions and motion graphics."],
  [181, "Compositing PC — Ryzen 7 RTX 4070 Super", "PC Builds", 154999, 169999, "pc", "Studio Compositing", "Creator workstation concept for complex effects and compositing."],
  [182, "Compositing PC — Intel Core i7 64GB RTX 4070", "PC Builds", 174999, 189999, "pc", "Memory Focus", "Workstation concept for high-resolution compositions and multitasking."],
  [183, "Compositing PC — Ryzen 9 RTX 5080 Class", "PC Builds", 289999, 319999, "pc", "Pro Compositing", "High-end compositing workstation concept for demanding production work."],
];

export const products = seed.map(
  ([id, name, category, price, oldPrice, imageKey, tag, description]) => ({
    id,
    name,
    category,
    price,
    oldPrice,
    image: images[imageKey],
    tag,
    rating: Number((4.5 + ((id % 5) * 0.1)).toFixed(1)),
    description,
    features: [
      "Demo catalog listing",
      "Check platform compatibility before purchase",
      "Verify final price, stock and warranty with the seller",
    ],
  })
);

export const categories = [
  ["Processors", "◈"],
  ["Motherboards", "▦"],
  ["Graphic Cards", "▰"],
  ["PC Cabinet", "▣"],
  ["Power Supply", "ϟ"],
  ["CPU Cooler", "❄"],
  ["RAM", "▤"],
  ["SSD", "▱"],
  ["Mouse", "⌁"],
  ["Keyboards", "⌨"],
  ["Headphones", "♫"],
  ["Mousepad", "▰"],
  ["Monitors", "▣"],
  ["Laptops", "▰"],
  ["PC Builds", "⚙"],
];
// Shared by the page UI and the 3D scene.
// Each step = one part being installed. Step i animates while progress is between i and i + 1.

export const STEP_SECONDS = 2.4; // seconds per step at 1x speed

export const STEPS = [
  {
    id: "case",
    short: "Cabinet",
    title: "Set up the cabinet (case)",
    text: "The cabinet holds and protects every part and guides the airflow. This mid-tower has see-through panels, so you can watch everything go in.",
    shopCategory: "PC Cabinet",
  },
  {
    id: "psu",
    short: "Power supply",
    title: "Mount the power supply (PSU)",
    text: "The PSU goes in first, at the bottom. It turns wall power into the stable low-voltage power every component needs.",
    shopCategory: "Power Supply",
  },
  {
    id: "motherboard",
    short: "Motherboard",
    title: "Install the motherboard",
    text: "The motherboard is the main circuit board that connects the CPU, memory, storage and graphics card. It is screwed onto brass standoffs on the back plate.",
    shopCategory: "Motherboards",
  },
  {
    id: "cpu",
    short: "Processor",
    title: "Place the processor (CPU)",
    text: "The CPU is the brain of the PC. Match the corner marker with the socket, lower it straight down and lock the socket arm. Shown see-through so you can see its layers.",
    shopCategory: "Processors",
  },
  {
    id: "cooler",
    short: "CPU cooler",
    title: "Attach the CPU cooler",
    text: "A thin layer of thermal paste goes on the CPU, then the cooler on top. Heat travels through copper pipes into the fins, and the fan blows it away.",
    shopCategory: "CPU Cooler",
  },
  {
    id: "ram",
    short: "Memory (RAM)",
    title: "Click in the memory (RAM)",
    text: "RAM is the short-term memory for games and apps. Two sticks go in slots 2 and 4 for dual-channel speed. Press until both clips snap shut.",
    shopCategory: "RAM",
  },
  {
    id: "ssd",
    short: "NVMe SSD",
    title: "Add the M.2 NVMe SSD",
    text: "The SSD stores Windows, games and files. An M.2 drive plugs straight into the motherboard and is held by a single screw.",
    shopCategory: "SSD",
  },
  {
    id: "gpu",
    short: "Graphics card",
    title: "Slot in the graphics card (GPU)",
    text: "The GPU draws every frame you see. It plugs into the top PCIe x16 slot and is secured to the case at the rear bracket.",
    shopCategory: "Graphic Cards",
  },
  {
    id: "fans",
    short: "Case fans",
    title: "Fit the case fans",
    text: "Front fans pull cool air in and the rear fan pushes hot air out. Good airflow keeps the parts cool and the PC quiet.",
    shopCategory: "PC Cabinet",
  },
  {
    id: "cables",
    short: "Power cables",
    title: "Connect the power cables",
    text: "Run the 24-pin motherboard cable, the CPU power cable and the graphics card power cable from the PSU to the parts they feed.",
    shopCategory: "Power Supply",
  },
  {
    id: "glass",
    short: "Glass panel & power on",
    title: "Close the glass panel and power on",
    text: "Put the tempered-glass side panel on and press the power button. The fans spin up and the RGB lighting comes alive. Your gaming PC is ready.",
    shopCategory: "PC Builds",
  },
];

export const STEP_COUNT = STEPS.length;
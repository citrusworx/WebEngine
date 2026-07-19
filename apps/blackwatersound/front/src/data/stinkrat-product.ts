import { AMP_IMG, GUITAR_IMG, STRAT_IMG } from "../components/brand/brand";

export const STINKRAT_GALLERY = [STRAT_IMG, AMP_IMG, GUITAR_IMG] as const;

export const STINKRAT_FINISHES = [
  { color: "#383838", name: "Midnight", default: true },
  { color: "#ff7716", name: "Burn" },
  { color: "#16dcff", name: "Void" },
] as const;

export const STINKRAT_SPECS = [
  ["True Bypass", "Relay switching"],
  ["Transistors", "Matched NOS germanium (AC128)"],
  ["Bias", "Internal trimmer, side panel access"],
  ["Controls", "Fuzz, Volume, Tone"],
  ["Input Impedance", "≥ 500 kΩ"],
  ["Current Draw", "< 2 mA @ 9V"],
  ["Power", "9V DC, centre-negative"],
  ["Dimensions", "112 × 60 × 50 mm"],
  ["Weight", "320 g"],
  ["Enclosure", "Die-cast aluminium, powder-coated"],
] as const;

export const STINKRAT_REVIEWS = [
  {
    name: "Marcus T.",
    stars: 5,
    text: "Best fuzz I've ever owned. The bias trimmer is a game-changer — sounds incredible through my Vox AC30.",
  },
  {
    name: "Lydia R.",
    stars: 4,
    text: "Stunning pedal. Only wish it came with a small screwdriver for the trimmer.",
  },
  {
    name: "Dev P.",
    stars: 4,
    text: "Ordered the Burn finish. Tone is exactly what I wanted for recording — warm, touch-sensitive, never harsh.",
  },
] as const;

export const STINKRAT_SPEC_GROUPS = [
  {
    group: "Signal Path",
    dot: "#96ff16",
    rows: [
      ["Bypass", "True bypass — relay switching"],
      ["Input Impedance", "≥ 500 kΩ"],
      ["Output Impedance", "≤ 10 kΩ"],
      ["Frequency Response", "30 Hz – 18 kHz (−3 dB)"],
    ],
  },
  {
    group: "Transistors",
    dot: "#96ff16",
    rows: [
      ["Type", "NOS germanium — AC128"],
      ["Matching", "Hand-matched HFE pairs (±5%)"],
      ["Bias", "Internal trimmer, side panel"],
      ["Leakage", "< 500 µA @ 25 °C"],
    ],
  },
  {
    group: "Controls",
    dot: "#96ff16",
    rows: [
      ["Fuzz", "Gain — 0 to full saturation"],
      ["Volume", "Output level — unity at 12 o'clock"],
      ["Tone", "Passive — cuts highs clockwise"],
    ],
  },
  {
    group: "Power",
    dot: "#16dcff",
    rows: [
      ["Supply", "9V DC, centre-negative"],
      ["Current Draw", "< 2 mA"],
      ["Battery", "Not supported"],
      ["Voltage Range", "8.5V – 9.5V"],
    ],
  },
  {
    group: "Physical",
    dot: "#16dcff",
    rows: [
      ["Enclosure", "Die-cast aluminium, powder-coated"],
      ["Dimensions", "112 × 60 × 50 mm"],
      ["Weight", "320 g"],
      ["Jacks", "6.35 mm mono — nickel-plated brass"],
    ],
  },
  {
    group: "Build",
    dot: "#16dcff",
    rows: [
      ["Assembly", "Point-to-point hand-wired, USA"],
      ["Resistors", "Carbon-composition, ±5%"],
      ["Capacitors", "Polystyrene film + electrolytic"],
      ["Included", "Pedal, test report, 2 mm hex key"],
    ],
  },
] as const;

export const STINKRAT_INFO_CARDS = [
  {
    title: "In the Box",
    accent: "#ff7716",
    items: [
      "StinkRat Fuzz pedal",
      "Test report with transistor HFE values",
      "2 mm hex key for bias access port",
      "Velcro strip (hook side)",
      "Blackwater Sound sticker sheet",
      "Certificate of build number",
    ],
  },
  {
    title: "Compatibility",
    accent: "#96ff16",
    body: "Works with any standard passive guitar or bass. Always run it first in chain, or use a high-impedance buffer if you must place it after a tuner. Adjust bias trimmer when switching between pickup types.",
  },
  {
    title: "Warranty & Support",
    accent: "#16dcff",
    pairs: [
      ["Warranty", "Lifetime limited — covers manufacturing defects."],
      ["Returns", "30-day no-questions return."],
      ["Repairs", "Flat $45 bench fee plus parts."],
      ["Bias service", "Free bias check within the first two years."],
    ],
  },
] as const;

export const STINKRAT_PROCESS = [
  {
    accent: "#96ff16",
    num: "01",
    title: "Sourced",
    body: "Every batch of AC128 transistors is sourced from verified NOS lots. Each transistor is measured for leakage, HFE, and saturation voltage before it touches a soldering iron.",
  },
  {
    accent: "#16dcff",
    num: "02",
    title: "Matched",
    body: "Q1 and Q2 are hand-matched by our technicians using a custom jig built in-house. We target HFE pairs within ±5%.",
  },
  {
    accent: "#ff7716",
    num: "03",
    title: "Built",
    body: "Point-to-point wiring means every connection is made by hand, inspected under magnification, and tested through a 24-hour soak.",
  },
] as const;

export const STINKRAT_RELATED = [
  { name: "RatKing", sub: "Silicon Fuzz", price: "$299", accent: "#ff4848", status: "Pre-order", href: "/products" },
  { name: "WaterMouth", sub: "Germanium Tremolo", price: "$389", accent: "#96ff16", status: "In Stock", href: "/products" },
  { name: "Mudwater 10", sub: "Single-Ended Tube Amp", price: "$1,290", accent: "#16dcff", status: "In Stock", href: "/products" },
] as const;

export const STINKRAT_DETAILS =
  "Each StinkRat Fuzz is point-to-point wired by hand using premium carbon-composition resistors, polystyrene film capacitors, and a pair of hand-selected and matched NOS AC128 germanium transistors. No printed circuit boards. No batch processing.";

export const STINKRAT_DESCRIPTION =
  "The StinkRat Fuzz oozes the thick, wooly saturation you need for psychedelic leads, wall-of-sound rhythm tracks, and everything in between. Matched NOS germanium transistors with an accessible bias trimmer mean you can tune the character of the pedal to your exact rig.";

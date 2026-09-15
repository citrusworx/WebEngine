import {
  AMP_IMG,
  GUITAR_IMG,
  MIC2_IMG,
  MIC_IMG,
  PHONES_IMG,
  STRAP_IMG,
  STRAT_IMG,
  STUDIO_IMG,
  TURNTABLE_IMG,
  VINYL_IMG,
} from "../components/brand/brand";

export type Category = "All" | "Effects" | "Amplifiers" | "Studio" | "Lifestyle" | "Accessories";

export interface CatalogProduct {
  id: string;
  name: string;
  sub: string;
  price: string;
  originalPrice?: string;
  img: string;
  accent: string;
  badge?: string;
  category: Exclude<Category, "All">;
  tags: string[];
  blurb: string;
  isNew?: boolean;
}

export const CATALOG: CatalogProduct[] = [
  {
    id: "stinkrat",
    name: "StinkRat",
    sub: "Germanium Fuzz",
    price: "$349",
    originalPrice: "$399",
    img: STRAT_IMG,
    accent: "orange",
    badge: "Launch Price",
    category: "Effects",
    tags: ["Fuzz", "Germanium", "Hand-wired"],
    blurb: "Matched NOS AC128 germanium pairs with a bias trim access point and a documented test report."
  },
  {
    id: "ratking",
    name: "RatKing",
    sub: "Silicon Fuzz",
    price: "$299",
    img: GUITAR_IMG,
    accent: "red",
    badge: "Pre-order",
    category: "Effects",
    tags: ["Fuzz", "Silicon", "High-gain"],
    blurb: "A harder, more modern voice for high-output pickups and dense mixes.",
    isNew: true
  },
  {
    id: "watermouth",
    name: "WaterMouth",
    sub: "Germanium Tremolo",
    price: "$389",
    img: VINYL_IMG,
    accent: "lime",
    category: "Effects",
    tags: ["Tremolo", "Germanium", "Vintage"],
    blurb: "Optical tremolo movement with a slow pulse and strong harmonic texture."
  },
  {
    id: "mudwater10",
    name: "Mudwater 10",
    sub: "Single-Ended Tube Amp",
    price: "$1,290",
    img: AMP_IMG,
    accent: "lime",
    category: "Amplifiers",
    tags: ["Tube", "Class A", "10W"],
    blurb: "Compact single-ended tone with a handmade pine cabinet and no unnecessary controls.",
    isNew: true
  },
  {
    id: "bogwater22",
    name: "Bogwater 22",
    sub: "Push-Pull Tube Amp",
    price: "$1,890",
    img: STUDIO_IMG,
    accent: "lime",
    category: "Amplifiers",
    tags: ["Tube", "Push-Pull", "22W"],
    blurb: "Point-to-point construction with switchable power modes for the room you are actually in."
  },
  {
    id: "darkroom1",
    name: "Darkroom 1",
    sub: "Large-Diaphragm Condenser",
    price: "$549",
    img: MIC2_IMG,
    accent: "cyan",
    category: "Studio",
    tags: ["Microphone", "Condenser", "Recording"],
    blurb: "Transformer-coupled output and three patterns for practical studio tracking."
  },
  {
    id: "sessionlight",
    name: "Session Light",
    sub: "Recording Status Light",
    price: "$89",
    img: MIC_IMG,
    accent: "red",
    category: "Studio",
    tags: ["Studio", "Recording", "Lighting"],
    blurb: "A warm ON AIR light that feels at home in a control room instead of a novelty aisle."
  },
  {
    id: "void500",
    name: "Void 500",
    sub: "Open-Back Headphones",
    price: "$379",
    img: PHONES_IMG,
    accent: "cyan",
    category: "Lifestyle",
    tags: ["Headphones", "Open-back", "Studio"],
    blurb: "Reference-minded headphones tuned for longer sessions and home listening alike."
  },
  {
    id: "blackwater1",
    name: "Blackwater 1",
    sub: "Belt-Drive Turntable",
    price: "$649",
    img: TURNTABLE_IMG,
    accent: "yellow",
    badge: "New",
    category: "Lifestyle",
    tags: ["Turntable", "Vinyl", "Home"],
    blurb: "Walnut plinth, built-in phono stage, and a calm industrial profile.",
    isNew: true
  },
  {
    id: "strap",
    name: "Blackwater Strap",
    sub: "Waxed Cotton and Leather",
    price: "$79",
    img: STRAP_IMG,
    accent: "orange",
    category: "Accessories",
    tags: ["Strap", "Leather", "Handmade"],
    blurb: "Bridle leather ends, waxed cotton body, and a fit that feels broken in from day one."
  }
];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  All: "Everything Blackwater Sound is shaping right now: pedals, amps, studio tools, listening gear, and the pieces that hold a rig together.",
  Effects: "Hand-built circuits that each make a clear tonal argument instead of chasing feature lists.",
  Amplifiers: "Small-batch tube amplifiers with straightforward control sets and room-aware voices.",
  Studio: "Tools for the room where sound gets captured, corrected, routed, and approved.",
  Lifestyle: "Listening and living products for people who spend real time inside music.",
  Accessories: "The quiet, dependable pieces that support the rest of the signal chain."
};

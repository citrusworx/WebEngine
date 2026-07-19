export type ProductRecord = {
  id: string;
  name: string;
  sub: string;
  price: string;
  originalPrice?: string;
  img: string;
  accent: string;
  badge?: string;
  category: "Effects" | "Amplifiers" | "Studio" | "Lifestyle" | "Accessories";
  tags: string[];
  blurb: string;
  isNew?: boolean;
};

export const SEED_PRODUCTS: ProductRecord[] = [
  {
    id: "stinkrat",
    name: "StinkRat",
    sub: "Germanium Fuzz",
    price: "$349",
    originalPrice: "$399",
    img: "https://images.unsplash.com/photo-1592922823354-c48e6d894bbe?w=900&h=1100&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800&h=800&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&h=800&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1565829073670-cd08d8c63643?w=900&h=700&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=700&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1601856254555-a9c0ebef8af3?w=700&h=900&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1531651008558-ed1740375b39?w=700&h=900&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=700&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1526394931762-90052e97b376?w=800&h=900&fit=crop&auto=format",
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
    img: "https://images.unsplash.com/photo-1755440322015-252e408bd96a?w=800&h=900&fit=crop&auto=format",
    accent: "orange",
    category: "Accessories",
    tags: ["Strap", "Leather", "Handmade"],
    blurb: "Bridle leather ends, waxed cotton body, and a fit that feels broken in from day one."
  }
];

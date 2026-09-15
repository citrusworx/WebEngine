const STUDIO_IMG = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=700&fit=crop&auto=format";
const GUITAR_IMG = "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800&h=800&fit=crop&auto=format";

export const SEED_POST = {
  slug: "germanium-vs-silicon-fuzz",
  title: "Why Germanium Still Beats Silicon for Fuzz",
  excerpt:
    "The debate between germanium and silicon transistors in fuzz circuits has been going on since the late 1960s. Fifty years on, boutique builders keep coming back to germanium — and there are very good reasons why.",
  heroImage: STUDIO_IMG,
  intro: [
    "The debate between germanium and silicon transistors in fuzz circuits has been going on since the late 1960s. Fifty years on, boutique builders keep coming back to germanium — and there are very good reasons why."
  ],
  sections: [
    {
      title: "The Physics of Saturation",
      paragraphs: [
        "Germanium transistors have a lower threshold voltage (~0.2V) compared to silicon (~0.6V). This means they enter saturation at much lower signal levels, producing a smoother, more organic breakup that tracks your picking dynamics."
      ]
    },
    {
      title: "Temperature Sensitivity: Feature or Bug?",
      paragraphs: [
        "Every technician who has serviced a vintage Fuzz Face will tell you the same story: it sounds different in winter. Germanium's electrical characteristics shift noticeably with temperature. The StinkRat Fuzz uses hand-matched germanium pairs with a bias trimmer so you can dial in exactly how much drift you want."
      ]
    },
    {
      title: "What Silicon Does Better",
      paragraphs: [
        "Silicon is more consistent, more stable, and easier to source. It can push higher gain levels before things get chaotic. Our upcoming RatKing Silicon Fuzz leans into exactly this — brutal, reliable, consistent clipping."
      ]
    }
  ]
};

export const SEED_LESSON = {
  id: "bias-germanium-fuzz",
  slug: "bias-germanium-fuzz",
  title: "Biasing Your Germanium Fuzz",
  course: "Fuzz Fundamentals",
  lessonNumber: 3,
  totalLessons: 6,
  progressPercent: 33,
  duration: "14:22",
  heroImage: GUITAR_IMG,
  summary:
    "Learn how to find the ideal bias point on a germanium fuzz pedal using a multimeter and your ears.",
  tabs: [
    {
      key: "learn",
      label: "What You'll Learn",
      body: [
        "In this lesson you'll learn how to find the ideal bias point on a germanium fuzz pedal using a multimeter and your ears. We cover why bias matters, the role of temperature, and how to use the onboard trimmer."
      ]
    },
    {
      key: "bias",
      label: "Why Bias Matters",
      body: [
        "The bias on a germanium fuzz controls the DC operating point of the transistors. Too low and the pedal sounds thin and gated. Too high and you lose definition and get a muddy wall of noise."
      ]
    },
    {
      key: "trimmer",
      label: "Using the Trimmer",
      body: [
        "The StinkRat Fuzz's internal trimmer adjusts collector voltage on Q2. Start with a multimeter clipped to the collector leg and look for a reading between 4.5V and 6V for most single-coil guitars."
      ]
    }
  ],
  outline: [
    { number: "01", title: "What is a Fuzz Pedal?", complete: true },
    { number: "02", title: "Germanium vs. Silicon", complete: true },
    { number: "03", title: "Biasing Your Fuzz", active: true },
    { number: "04", title: "Stacking with Other Pedals" },
    { number: "05", title: "Recording Fuzz in the Studio" },
    { number: "06", title: "Live Rig Integration" }
  ],
  instructor: { initials: "JM", name: "Jake Mercer", role: "Head of Circuit Design" }
};

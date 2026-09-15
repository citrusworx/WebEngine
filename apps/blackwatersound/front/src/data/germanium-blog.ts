export const GERMANIUM_BLOG = {
  slug: "germanium-vs-silicon-fuzz",
  category: "Gear Talk",
  date: "June 12, 2026",
  readTime: "8 min read",
  titleLine1: "Why Germanium Still",
  titleLine2: "Beats Silicon for Fuzz",
  author: {
    initials: "JM",
    name: "Jake Mercer",
    role: "Head of Circuit Design, Blackwater Sound",
  },
  lead:
    "The debate between germanium and silicon transistors in fuzz circuits has been going on since the late 1960s. Fifty years on, boutique builders keep coming back to germanium — and there are very good reasons why.",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
  videoLabel: "Watch: Germanium vs. Silicon Fuzz Demo",
  sections: [
    {
      heading: "The Physics of Saturation",
      body: "Germanium transistors have a lower threshold voltage (~0.2V) compared to silicon (~0.6V). This means they enter saturation at much lower signal levels, producing a smoother, more organic breakup that tracks your picking dynamics.",
    },
    {
      heading: "Temperature Sensitivity: Feature or Bug?",
      body: "Every technician who has serviced a vintage Fuzz Face will tell you the same story: it sounds different in winter. Germanium's electrical characteristics shift noticeably with temperature. The StinkRat Fuzz uses hand-matched germanium pairs with a bias trimmer so you can dial in exactly how much drift you want.",
    },
    {
      heading: "What Silicon Does Better",
      body: "Silicon is more consistent, more stable, and easier to source. It can push higher gain levels before things get chaotic. Our upcoming RatKing Silicon Fuzz leans into exactly this — brutal, reliable, consistent clipping.",
    },
  ],
  quote: {
    text: "The bias trimmer isn't a gimmick — it's how you tune the germanium to your guitar, your amp, and the room temperature on a given night.",
    credit: "Jake Mercer, Head of Circuit Design",
  },
} as const;

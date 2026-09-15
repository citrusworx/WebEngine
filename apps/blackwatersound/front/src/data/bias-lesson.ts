export const BIAS_LESSON = {
  course: "Fuzz Fundamentals",
  lessonNumber: 3,
  totalLessons: 6,
  progressPercent: 33,
  titleLine1: "Biasing Your",
  titleLine2: "Germanium Fuzz",
  duration: "14:22",
  courseMeta: "6 lessons · ~90 min",
  sections: [
    {
      title: "What You'll Learn",
      content:
        "In this lesson you'll learn how to find the ideal bias point on a germanium fuzz pedal using a multimeter and your ears. We cover why bias matters, the role of temperature, and how to use the onboard trimmer.",
    },
    {
      title: "Why Bias Matters",
      content:
        "The bias on a germanium fuzz controls the DC operating point of the transistors. Too low and the pedal sounds thin and gated. Too high and you lose definition and get a muddy wall of noise.",
    },
    {
      title: "Using the Trimmer",
      content:
        "The StinkRat Fuzz's internal trimmer adjusts collector voltage on Q2. Start with a multimeter clipped to the collector leg and look for a reading between 4.5V and 6V for most single-coil guitars.",
    },
  ],
  takeaways: [
    "Collector voltage on Q2 should land between 4.5V–6V for single-coil guitars.",
    "Temperature shifts the bias — give the pedal 10 minutes to stabilise before you set it.",
    "Always set bias with your guitar plugged in and volume at playing level.",
    "A squealing, gated sound means your bias is too low. Muddy and compressed means too high.",
  ],
  outline: [
    { num: "01", title: "What is a Fuzz Pedal?", done: true },
    { num: "02", title: "Germanium vs. Silicon", done: true },
    { num: "03", title: "Biasing Your Fuzz", active: true },
    { num: "04", title: "Stacking with Other Pedals" },
    { num: "05", title: "Recording Fuzz in the Studio" },
    { num: "06", title: "Live Rig Integration" },
  ],
} as const;

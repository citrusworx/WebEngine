export type HubScreen =
  | "dashboard"
  | "audience"
  | "artists"
  | "segments"
  | "campaigns"
  | "reports"
  | "report-mgmt";

export type HubNavItem = {
  id: HubScreen;
  label: string;
  icon: string;
  section: string | null;
};

export type LeverageCategory = {
  id: string;
  label: string;
  score: number;
  status: string;
  missing: string;
  color: string;
};

export type HubAction = {
  priority: "High" | "Medium" | "Low";
  action: string;
  area: string;
};

export type GrowthPoint = {
  month: string;
  fans: number;
  email: number;
};

export type RegionFanCount = {
  region: string;
  fans: number;
  color: string;
};

export type AgeRange = {
  range: string;
  pct: number;
};

export type PlatformScore = {
  platform: string;
  score: number;
};

export type MgmtMetric = {
  label: string;
  value: string;
  score: number;
  color: string;
};

export const HUB_COLORS = {
  sidebar: "#0f0e17",
  sidebarBd: "rgba(255,255,255,0.07)",
  canvas: "#f4f3f8",
  card: "#ffffff",
  border: "rgba(0,0,0,0.08)",
  violet: "#7c3aed",
  violetSoft: "#ede9fe",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  ink: "#16151f",
  sub: "#6b6880",
  muted: "#ececf2",
} as const;

export const HUB_NAV: HubNavItem[] = [
  { id: "dashboard", label: "Career Dashboard", icon: "⬡", section: null },
  { id: "audience", label: "Audience Compass", icon: "◎", section: "Intelligence" },
  { id: "artists", label: "Similar Artists", icon: "≋", section: "Intelligence" },
  { id: "segments", label: "Fan Segments", icon: "◫", section: "Intelligence" },
  { id: "campaigns", label: "Campaign Builder", icon: "⟳", section: "Marketing" },
  { id: "reports", label: "Leverage Reports", icon: "▤", section: "Reports" },
];

export const HUB_TITLES: Record<HubScreen, { title: string; sub: string }> = {
  dashboard: { title: "Career Dashboard", sub: "Your music career at a glance" },
  audience: { title: "Audience Compass", sub: "Privacy-safe audience intelligence and marketing guidance" },
  artists: { title: "Similar Artist Research", sub: "Compare audience signals with artists your fans already follow" },
  segments: { title: "Fan Segments", sub: "Understand who your fans are and how to reach each group" },
  campaigns: { title: "Campaign Builder", sub: "Turn Audience Compass insights into campaigns ready to run" },
  reports: { title: "Leverage Reports", sub: "Professional proof for managers, venues, and sponsors" },
  "report-mgmt": { title: "Management Readiness Report", sub: "Generated · Q2 2026 · Jamie Cole" },
};

export const GROWTH_DATA: GrowthPoint[] = [
  { month: "Sep", fans: 1800, email: 210 },
  { month: "Oct", fans: 2050, email: 240 },
  { month: "Nov", fans: 2200, email: 270 },
  { month: "Dec", fans: 2400, email: 295 },
  { month: "Jan", fans: 2600, email: 315 },
  { month: "Feb", fans: 2800, email: 340 },
];

export const LEVERAGE_CATEGORIES: LeverageCategory[] = [
  { id: "presence", label: "Presence", score: 82, status: "EPK live · website active", missing: "No press quotes", color: HUB_COLORS.emerald },
  { id: "audience", label: "Audience", score: 46, status: "~2,800 identified fans", missing: "No regional breakdown yet", color: HUB_COLORS.amber },
  { id: "content", label: "Content", score: 71, status: "Consistent posting", missing: "No long-form video strategy", color: HUB_COLORS.emerald },
  { id: "releases", label: "Releases", score: 63, status: "2 singles in 2026", missing: "No pre-save campaign", color: HUB_COLORS.cyan },
  { id: "fanCapture", label: "Fan Capture", score: 38, status: "340 email subscribers", missing: "No lead magnet active", color: HUB_COLORS.amber },
  { id: "store", label: "Store", score: 55, status: "$1,240 in merch revenue", missing: "No digital products", color: HUB_COLORS.cyan },
  { id: "booking", label: "Booking", score: 58, status: "14 shows in last 12 months", missing: "No tech rider on EPK", color: HUB_COLORS.cyan },
  { id: "sponsorship", label: "Sponsorship", score: 22, status: "No active sponsorships", missing: "No media kit PDF", color: HUB_COLORS.rose },
  { id: "management", label: "Management", score: 34, status: "No manager · self-managed", missing: "Incomplete revenue data", color: HUB_COLORS.rose },
  { id: "operations", label: "Operations", score: 67, status: "Booking sheet · release calendar", missing: "No CRM workflow", color: HUB_COLORS.emerald },
];

export const HUB_ACTIONS: HubAction[] = [
  { priority: "High", action: "Activate a fan unlock lead magnet before your next release", area: "Fan Capture" },
  { priority: "High", action: "Add tech rider PDF to your EPK — required by most mid-level venues", area: "Booking" },
  { priority: "Medium", action: "Set up Audience Compass to map your likely fan demographics", area: "Audience" },
  { priority: "Medium", action: "Create a one-page sponsorship deck with audience data", area: "Sponsorship" },
  { priority: "Low", action: "Record one long-form YouTube video (10+ min) this quarter", area: "Content" },
];

export const REGION_DATA: RegionFanCount[] = [
  { region: "Texas", fans: 820, color: HUB_COLORS.violet },
  { region: "Nashville", fans: 510, color: HUB_COLORS.cyan },
  { region: "Gulf Coast", fans: 390, color: HUB_COLORS.emerald },
  { region: "Georgia", fans: 280, color: HUB_COLORS.amber },
  { region: "Oklahoma", fans: 190, color: "#a78bfa" },
  { region: "Other", fans: 610, color: HUB_COLORS.muted },
];

export const AGE_DATA: AgeRange[] = [
  { range: "18–23", pct: 12 },
  { range: "24–30", pct: 28 },
  { range: "31–38", pct: 34 },
  { range: "39–46", pct: 18 },
  { range: "47+", pct: 8 },
];

export const PLATFORM_DATA: PlatformScore[] = [
  { platform: "Spotify", score: 82 },
  { platform: "YouTube", score: 71 },
  { platform: "Instagram", score: 68 },
  { platform: "TikTok", score: 44 },
  { platform: "Facebook", score: 58 },
  { platform: "Email", score: 90 },
];

export const MGMT_METRICS: MgmtMetric[] = [
  { label: "Audience Growth", value: "↑ 18% QoQ", score: 62, color: HUB_COLORS.amber },
  { label: "Email List", value: "340 subs", score: 38, color: HUB_COLORS.rose },
  { label: "Website Traffic", value: "1,100/mo", score: 55, color: HUB_COLORS.amber },
  { label: "EPK Views", value: "240 (30 days)", score: 48, color: HUB_COLORS.amber },
  { label: "Store Revenue", value: "$1,240 YTD", score: 60, color: HUB_COLORS.cyan },
  { label: "Booking Inquiries", value: "6 inbound", score: 55, color: HUB_COLORS.cyan },
  { label: "Content Consistency", value: "3.2×/week", score: 71, color: HUB_COLORS.emerald },
  { label: "Release Activity", value: "2 singles '26", score: 63, color: HUB_COLORS.cyan },
];

export const STUDIO_SESSION_QUEUE = [
  { artist: "River Glass", project: "EP tracking", status: "In room", time: "10:00 AM" },
  { artist: "North End", project: "Mix review v3", status: "Awaiting notes", time: "1:30 PM" },
  { artist: "Jamie Cole", project: "Master prep", status: "Scheduled", time: "4:00 PM" },
] as const;

export const STUDIO_TRANSFER_ITEMS = [
  { name: "River_Glass_EP_stems.zip", size: "2.4 GB", state: "Ready for artist" },
  { name: "NorthEnd_mix_v3.wav", size: "84 MB", state: "Pending approval" },
  { name: "JamieCole_master_ref.wav", size: "61 MB", state: "Uploaded today" },
] as const;

export type SimilarArtist = {
  name: string;
  genre: string;
  age: string;
  region: string;
  spotify: number;
  youtube: number;
  merch: number;
  shows: number;
};

export type FanSegment = {
  name: string;
  size: number;
  growth: string;
  source: string;
  bestCTA: string;
  campaign: string;
  color: string;
};

export type HubReportCard = {
  name: string;
  score: number;
  status: string;
  color: string;
  desc: string;
  id: HubScreen | null;
};

export type AudienceInsight = {
  insight: string;
  artists: string;
  action: string;
};

export const SIMILAR_ARTISTS: SimilarArtist[] = [
  { name: "Tyler Childers", genre: "Country/Folk", age: "25–40", region: "Appalachia, Midwest", spotify: 90, youtube: 78, merch: 82, shows: 95 },
  { name: "Colter Wall", genre: "Country/Folk", age: "22–38", region: "Northern US, Canada", spotify: 75, youtube: 65, merch: 70, shows: 88 },
  { name: "Jason Isbell", genre: "Americana Rock", age: "28–45", region: "South, Nashville", spotify: 85, youtube: 72, merch: 78, shows: 90 },
  { name: "Turnpike Troubadours", genre: "Americana", age: "25–42", region: "Oklahoma, Texas", spotify: 80, youtube: 68, merch: 85, shows: 92 },
  { name: "Zach Bryan", genre: "Country/Indie", age: "18–35", region: "Nationwide", spotify: 95, youtube: 90, merch: 80, shows: 94 },
];

export const AUDIENCE_INSIGHTS: AudienceInsight[] = [
  {
    insight: "Heavy live-show attendance",
    artists: "Turnpike, Isbell, Childers",
    action: "Target show-goers in your touring markets first.",
  },
  {
    insight: "Merch buyers at higher rates",
    artists: "Turnpike, Zach Bryan",
    action: "Launch merch before or at release — these fans buy on drop day.",
  },
  {
    insight: "Southern/Gulf Coast concentration",
    artists: "All 5 artists overlap here",
    action: "Texas and Gulf Coast are your highest-probability launch markets.",
  },
];

export const FAN_SEGMENTS: FanSegment[] = [
  { name: "Superfans", size: 142, growth: "+8%", source: "Email + Store", bestCTA: "Exclusive pre-save", campaign: "VIP access offer", color: HUB_COLORS.violet },
  { name: "Merch Buyers", size: 231, growth: "+22%", source: "Store", bestCTA: "Limited edition drop", campaign: "Drop-day email blast", color: HUB_COLORS.emerald },
  { name: "Show Attendees", size: 410, growth: "+14%", source: "Ticketing + CRM", bestCTA: "Next show announcement", campaign: "Venue city targeting", color: HUB_COLORS.cyan },
  { name: "Local Fans", size: 680, growth: "+6%", source: "Website + Social", bestCTA: "House show invite", campaign: "Austin local ad test", color: HUB_COLORS.amber },
  { name: "Email Subscribers", size: 340, growth: "+12%", source: "Email List", bestCTA: "Exclusive acoustic", campaign: "Welcome sequence", color: HUB_COLORS.violet },
  { name: "Similar-Artist Fans", size: 1200, growth: "new", source: "Research estimate", bestCTA: "Discovery playlist", campaign: "Spotify ad targeting", color: HUB_COLORS.cyan },
  { name: "New Listeners", size: 560, growth: "+31%", source: "Streaming", bestCTA: "Follow prompt", campaign: "Pre-save campaign", color: HUB_COLORS.emerald },
  { name: "Industry Contacts", size: 48, growth: "+2%", source: "CRM", bestCTA: "EPK share", campaign: "Booking outreach", color: HUB_COLORS.sub },
  { name: "VIP Fans", size: 38, growth: "+5%", source: "Manual + Surveys", bestCTA: "Studio session invite", campaign: "Inner circle offer", color: HUB_COLORS.rose },
];

export const CAMPAIGN_TYPES = [
  "Release Awareness",
  "Fan Capture",
  "Merch Drop",
  "Show Promotion",
  "EPK / Press Push",
  "Booking Market Test",
  "Sponsorship Pitch",
  "YouTube Growth",
  "TikTok Short-Form",
  "Local / Regional Ad",
] as const;

export const CAMPAIGN_PLATFORMS = [
  "Spotify + Meta",
  "Instagram",
  "TikTok",
  "YouTube",
  "Email Only",
  "Meta Only",
] as const;

export const CAMPAIGN_GUIDANCE = [
  "Release awareness campaigns work best launched 4–6 weeks before drop day.",
  "A pre-save link captures intent before the release exists — more valuable than 'listen now'.",
  "Gulf Coast + Nashville markets are your highest-probability audience from similar artist data.",
  "Chorus clips under 45 seconds outperform full songs on paid platforms 2.4× for new listeners.",
] as const;

export const CAMPAIGN_ASSETS = [
  { asset: "Chorus clip (30–45 sec)", status: "Upload needed", check: false },
  { asset: "Acoustic live version", status: "Upload needed", check: false },
  { asset: "Behind-the-song video", status: "Optional", check: false },
  { asset: "Pre-save landing page", status: "Not built yet", check: false },
  { asset: "Email follow-up sequence", status: "Drafted", check: true },
] as const;

export const HUB_REPORTS: HubReportCard[] = [
  { name: "Management Readiness", score: 34, status: "Needs work", color: HUB_COLORS.rose, desc: "Helps approach reputable management with organised career proof.", id: "report-mgmt" },
  { name: "Booking Leverage", score: 58, status: "In progress", color: HUB_COLORS.amber, desc: "Fan locations, show history, and regional concentration for venues.", id: null },
  { name: "Sponsorship Readiness", score: 22, status: "Needs work", color: HUB_COLORS.rose, desc: "Audience demographics, engagement, and brand alignment for sponsors.", id: null },
  { name: "Release Performance", score: 71, status: "Looking good", color: HUB_COLORS.cyan, desc: "Stream counts, playlist adds, and audience growth per release.", id: null },
  { name: "Fan Growth", score: 66, status: "On track", color: HUB_COLORS.emerald, desc: "Email list, social, and fan count trajectory over time.", id: null },
  { name: "Tour Market", score: 55, status: "Building", color: HUB_COLORS.amber, desc: "Top cities by fan density and willingness to travel.", id: null },
  { name: "EPK Engagement", score: 48, status: "Building", color: HUB_COLORS.amber, desc: "EPK views, time-on-page, and contact form conversions.", id: null },
  { name: "Store / Revenue", score: 60, status: "On track", color: HUB_COLORS.emerald, desc: "Merch, digital, and ticket revenue snapshot.", id: null },
];

import { GROWTH_DATA, HUB_COLORS } from "../../data/hub";

export function HubGrowthChart() {
  const maxFans = Math.max(...GROWTH_DATA.map((point) => point.fans));
  const width = 640;
  const height = 160;
  const padding = 24;

  const fanPoints = GROWTH_DATA.map((point, index) => {
    const x = padding + (index / (GROWTH_DATA.length - 1)) * (width - padding * 2);
    const y = height - padding - (point.fans / maxFans) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const emailPoints = GROWTH_DATA.map((point, index) => {
    const x = padding + (index / (GROWTH_DATA.length - 1)) * (width - padding * 2);
    const y = height - padding - (point.email / maxFans) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div hub-panel style={{ marginBottom: "24px" }}>
      <p hub-panel-title>Fan &amp; Email Growth</p>
      <p hub-panel-sub>Last 6 months</p>
      <svg hub-growth-chart viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline fill="none" stroke={HUB_COLORS.muted} strokeWidth="1" points={`${padding},${height - padding} ${width - padding},${height - padding}`} />
        <polyline fill="none" stroke={HUB_COLORS.violet} strokeWidth="2.5" points={fanPoints} />
        <polyline fill="none" stroke={HUB_COLORS.emerald} strokeWidth="2.5" points={emailPoints} />
        {GROWTH_DATA.map((point, index) => {
          const x = padding + (index / (GROWTH_DATA.length - 1)) * (width - padding * 2);
          return (
            <text key={point.month} x={x} y={height - 6} text-anchor="middle" fill={HUB_COLORS.sub} font-size="10">
              {point.month}
            </text>
          );
        })}
      </svg>
      <div hub-growth-legend>
        <span hub-growth-legend-item>
          <span hub-growth-legend-swatch style={{ backgroundColor: HUB_COLORS.violet }} />
          Identified fans
        </span>
        <span hub-growth-legend-item>
          <span hub-growth-legend-swatch style={{ backgroundColor: HUB_COLORS.emerald }} />
          Email subscribers
        </span>
      </div>
    </div>
  );
}

import { HubBadge } from "../HubBadge";
import { HUB_COLORS, MGMT_METRICS } from "../../../data/hub";

const TALKING_POINTS = [
  "Audience growing 18% QoQ with concentrated presence in Texas, Gulf Coast, and Nashville-adjacent markets — natural touring circuit.",
  "Consistent release cadence: 2 singles in 2026 with streaming growth across each release.",
  "EPK active with press shots, bio, and stage plot. 240 views in the last 30 days.",
  "Store revenue of $1,240 YTD demonstrates early fan purchase behaviour without active promotion.",
] as const;

const GAPS = [
  {
    gap: "Email list below 1,000",
    fix: "Activate a lead magnet — fan unlock, acoustic demo, or presale access. Target 1,000 in 90 days.",
  },
  {
    gap: "No documented ticket revenue",
    fix: "Export ticket sales from your last 5 shows and add to your report. Even $800 in ticket revenue is signal.",
  },
  {
    gap: "No media kit PDF",
    fix: "Create a one-page PDF with audience data, top regions, and revenue summary.",
  },
  {
    gap: "No management talking-points document",
    fix: "Use the recommended talking points above and build a one-page artist brief to send ahead of meetings.",
  },
] as const;

export function HubMgmtReport() {
  return (
    <div hub-content style={{ maxWidth: "820px" }}>
      <section hub-report-hero>
        <div row space="between" gap="1.5rem">
          <div stack gap="0.35rem">
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Leverage Report · Q2 2026
            </p>
            <p hub-report-score style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Management Readiness</p>
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.45)", textTransform: "none", letterSpacing: "normal", fontSize: "13px" }}>
              Jamie Cole · Austin, TX · Country-Rock / Americana
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p hub-report-score style={{ color: HUB_COLORS.amber }}>34%</p>
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.35)", textTransform: "none", letterSpacing: "normal" }}>
              Overall Readiness
            </p>
          </div>
        </div>
        <div row gap="0.75rem" style={{ marginTop: "20px" }}>
          <button type="button" hub-btn data-variant="primary">Export PDF</button>
          <button type="button" hub-btn data-variant="ghost">Copy Private Link</button>
        </div>
      </section>

      <article hub-panel>
        <p hub-panel-title>Summary</p>
        <p hub-panel-sub style={{ marginBottom: 0, lineHeight: 1.75 }}>
          Jamie Cole has an active release schedule, consistent content output, and early evidence of regional audience concentration around Texas and the Gulf Coast. The core gaps blocking management interest are a low email list size, absence of a revenue breakdown, and no documented show attendance data.
        </p>
      </article>

      <article hub-panel>
        <p hub-panel-title>Key Metrics</p>
        <div hub-metric-grid>
          {MGMT_METRICS.map((metric) => (
            <div key={metric.label} hub-metric-card>
              <div stack gap="0.15rem" style={{ flex: 1 }}>
                <span hub-brand-sub style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: HUB_COLORS.sub }}>
                  {metric.label}
                </span>
                <p hub-panel-title style={{ fontSize: "14px", margin: 0 }}>{metric.value}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ width: "44px", height: "3px", background: HUB_COLORS.muted, borderRadius: "2px" }}>
                  <div style={{ width: `${metric.score}%`, height: "100%", background: metric.color, borderRadius: "2px" }} />
                </div>
                <p hub-brand-sub style={{ color: metric.color, marginTop: "2px", textTransform: "none", letterSpacing: "normal" }}>
                  {metric.score}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article hub-panel>
        <p hub-panel-title>Recommended Talking Points</p>
        {TALKING_POINTS.map((point, index) => (
          <div key={point} row gap="0.75rem" style={{ marginBottom: "12px" }}>
            <div style={{ width: "18px", height: "18px", background: HUB_COLORS.violetSoft, borderRadius: "3px", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--hub-mono)", fontSize: "9px", color: HUB_COLORS.violet, fontWeight: 500 }}>{index + 1}</span>
            </div>
            <p hub-panel-sub style={{ margin: 0, lineHeight: 1.65 }}>{point}</p>
          </div>
        ))}
      </article>

      <section hub-gap-panel>
        <p hub-panel-title style={{ color: HUB_COLORS.rose }}>Gaps to Close Before Approaching Management</p>
        {GAPS.map((item) => (
          <div key={item.gap} style={{ marginBottom: "14px" }}>
            <p hub-panel-title style={{ fontSize: "12px", color: HUB_COLORS.rose, marginBottom: "3px" }}>⚠ {item.gap}</p>
            <p hub-panel-sub style={{ margin: 0, lineHeight: 1.6 }}>{item.fix}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

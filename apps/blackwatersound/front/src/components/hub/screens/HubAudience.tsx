import { HubBadge } from "../HubBadge";
import { AGE_DATA, HUB_COLORS, PLATFORM_DATA, REGION_DATA } from "../../../data/hub";

export function HubAudience() {
  const maxFans = Math.max(...REGION_DATA.map((region) => region.fans));

  return (
    <div hub-content>
      <section hub-audience-hero>
        <div row space="between" gap="1rem">
          <div stack gap="0.75rem" style={{ flex: 1 }}>
            <div row gap="0.5rem">
              <span hub-brand-sub style={{ color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Primary Audience Hypothesis
              </span>
              <HubBadge label="68% confidence" color="#fff" bg="rgba(255,255,255,0.15)" />
            </div>
            <p style={{ margin: 0, fontFamily: "var(--hub-body)", fontSize: "15px", fontWeight: 600, lineHeight: 1.5, color: "#fff" }}>
              Fans most likely to respond are 24–38, working adults, concentrated around Gulf Coast cities, Nashville-adjacent markets, Texas, and Georgia.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>CONFIDENCE</p>
            <p hub-report-score style={{ color: "#fff", fontSize: "36px" }}>68%</p>
          </div>
        </div>
      </section>

      <div hub-two-col>
        <article hub-panel>
          <p hub-panel-title>Top Regions</p>
          <p hub-panel-sub>Estimated fan concentration</p>
          {REGION_DATA.map((region) => (
            <div key={region.region} hub-bar-row>
              <span hub-bar-label>{region.region}</span>
              <div hub-bar-track>
                <div hub-bar-fill style={{ width: `${(region.fans / maxFans) * 100}%`, backgroundColor: region.color }} />
              </div>
              <span hub-bar-value>{region.fans}</span>
            </div>
          ))}
        </article>

        <article hub-panel>
          <p hub-panel-title>Likely Age Ranges</p>
          <p hub-panel-sub>Based on similar artist data + email signals</p>
          {AGE_DATA.map((age) => (
            <div key={age.range} hub-bar-row>
              <span hub-bar-label style={{ width: "44px" }}>{age.range}</span>
              <div hub-bar-track>
                <div
                  hub-bar-fill
                  style={{
                    width: `${age.pct}%`,
                    backgroundColor: age.pct >= 28 ? HUB_COLORS.violet : HUB_COLORS.cyan,
                  }}
                />
              </div>
              <span hub-bar-value>{age.pct}%</span>
            </div>
          ))}
        </article>
      </div>

      <article hub-panel>
        <p hub-panel-title>Platform Strength</p>
        {PLATFORM_DATA.map((platform) => (
          <div key={platform.platform} hub-bar-row>
            <span hub-bar-label style={{ width: "80px", fontFamily: "var(--hub-body)", fontSize: "12px", color: HUB_COLORS.ink }}>
              {platform.platform}
            </span>
            <div hub-bar-track style={{ height: "6px" }}>
              <div
                hub-bar-fill
                style={{
                  width: `${platform.score}%`,
                  backgroundColor:
                    platform.score >= 80 ? HUB_COLORS.emerald : platform.score >= 60 ? HUB_COLORS.cyan : HUB_COLORS.amber,
                }}
              />
            </div>
            <span hub-bar-value style={{ width: "24px" }}>{platform.score}</span>
          </div>
        ))}
      </article>
    </div>
  );
}

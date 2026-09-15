import { HubBadge } from "../HubBadge";
import { HubGrowthChart } from "../HubGrowthChart";
import { HubStatCard } from "../HubStatCard";
import { ScoreRing } from "../ScoreRing";
import { HUB_ACTIONS, HUB_COLORS, LEVERAGE_CATEGORIES, type HubScreen } from "../../../data/hub";

export function HubDashboard(props: { onNavigate: (screen: HubScreen) => void }) {
  const overall = Math.round(
    LEVERAGE_CATEGORIES.reduce((sum, category) => sum + category.score, 0) / LEVERAGE_CATEGORIES.length
  );

  return (
    <div hub-content>
      <div hub-stat-grid>
        <HubStatCard label="Overall Leverage" value={`${overall}%`} delta="+8pp" accent={HUB_COLORS.violet} />
        <HubStatCard label="Identified Fans" value="2,800" delta="+18%" />
        <HubStatCard label="Email Subscribers" value="340" delta="+12%" />
        <HubStatCard label="Merch Revenue YTD" value="$1,240" delta="+34%" />
      </div>

      <HubGrowthChart />

      <p hub-panel-title style={{ marginBottom: "12px" }}>Career Leverage Categories</p>
      <div hub-leverage-grid>
        {LEVERAGE_CATEGORIES.map((category) => (
          <article
            key={category.id}
            hub-leverage-card
            data-clickable={category.id === "audience" ? true : undefined}
            onClick={() => {
              if (category.id === "audience") {
                props.onNavigate("audience");
              }
            }}
          >
            <ScoreRing score={category.score} color={category.color} />
            <div stack gap="0.25rem" style={{ flex: 1, minWidth: 0 }}>
              <div row gap="0.5rem">
                <p hub-panel-title style={{ fontSize: "13px", margin: 0 }}>{category.label}</p>
                {category.score < 40 ? <HubBadge label="Needs work" color={HUB_COLORS.rose} /> : null}
                {category.score >= 75 ? <HubBadge label="Strong" color={HUB_COLORS.emerald} /> : null}
              </div>
              <p hub-panel-sub style={{ margin: 0, fontSize: "11px" }}>{category.status}</p>
              <p hub-panel-sub style={{ margin: "2px 0 0", fontSize: "10px", color: HUB_COLORS.amber }}>
                ⚠ {category.missing}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section hub-actions>
        <p hub-actions-title>Recommended Next Actions</p>
        {HUB_ACTIONS.map((item) => (
          <div key={item.action} hub-action-row>
            <HubBadge
              label={item.priority}
              color={
                item.priority === "High"
                  ? HUB_COLORS.rose
                  : item.priority === "Medium"
                    ? HUB_COLORS.amber
                    : HUB_COLORS.sub
              }
            />
            <p hub-action-copy>{item.action}</p>
            <span hub-action-area>{item.area}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

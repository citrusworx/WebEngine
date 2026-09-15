import { HubBadge } from "../../components/hub/HubBadge";
import { HubStatCard } from "../../components/hub/HubStatCard";
import { HUB_COLORS, STUDIO_SESSION_QUEUE, STUDIO_TRANSFER_ITEMS } from "../../data/hub";

export function StudioPortal() {
  return (
    <div stack style={{ background: "var(--hub-canvas, #f4f3f8)", minHeight: "calc(100vh - 70px)" }}>
      <header hub-studio-topbar>
        <a href="/" hub-studio-home>← Blackwater Sound</a>
        <span hub-quarter-pill>Studio Ops</span>
      </header>
      <section hub-report-hero style={{ borderRadius: 0 }}>
        <div row space="between" gap="1.5rem">
          <div stack gap="0.35rem">
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Studio Operations · Q2 2026
            </p>
            <p hub-report-score style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Blackwater Sound Control Room</p>
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.45)", textTransform: "none", letterSpacing: "normal", fontSize: "13px" }}>
              Session transfer · file notes · mix versions · approvals
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p hub-report-score style={{ color: HUB_COLORS.cyan, fontSize: "32px" }}>3</p>
            <p hub-brand-sub style={{ color: "rgba(255,255,255,0.35)", textTransform: "none", letterSpacing: "normal" }}>
              Sessions today
            </p>
          </div>
        </div>
        <div row gap="0.75rem" style={{ marginTop: "20px" }}>
          <button type="button" hub-btn data-variant="primary">New transfer</button>
          <button type="button" hub-btn data-variant="ghost">Upload mix</button>
        </div>
      </section>

      <div shell stack gap="1.5rem" style={{ padding: "28px 0" }}>
        <div hub-stat-grid>
          <HubStatCard label="Rooms active" value="02" delta="+1" accent={HUB_COLORS.violet} />
          <HubStatCard label="Transfers pending" value="04" />
          <HubStatCard label="Mix versions" value="11" delta="+3" />
          <HubStatCard label="Approvals waiting" value="02" accent={HUB_COLORS.amber} />
        </div>

        <div hub-two-col>
          <article hub-panel>
            <p hub-panel-title>Today&apos;s session queue</p>
            <p hub-panel-sub>Live room schedule and engineer assignments</p>
            <div hub-studio-queue>
              {STUDIO_SESSION_QUEUE.map((session) => (
                <div key={session.artist} hub-studio-row>
                  <div stack gap="0.15rem">
                    <p hub-panel-title style={{ fontSize: "13px", margin: 0 }}>{session.artist}</p>
                    <p hub-panel-sub style={{ margin: 0 }}>{session.project}</p>
                  </div>
                  <div stack gap="0.15rem" hub-align-right>
                    <HubBadge label={session.status} color={HUB_COLORS.cyan} />
                    <span hub-brand-sub style={{ textTransform: "none", letterSpacing: "normal", color: HUB_COLORS.sub }}>
                      {session.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article hub-panel>
            <p hub-panel-title>Transfer inbox</p>
            <p hub-panel-sub>Files waiting for artist review or studio approval</p>
            <div hub-studio-queue>
              {STUDIO_TRANSFER_ITEMS.map((item) => (
                <div key={item.name} hub-studio-row>
                  <div stack gap="0.15rem">
                    <p hub-panel-title style={{ fontSize: "13px", margin: 0 }}>{item.name}</p>
                    <p hub-panel-sub style={{ margin: 0 }}>{item.size}</p>
                  </div>
                  <HubBadge label={item.state} color={HUB_COLORS.violet} />
                </div>
              ))}
            </div>
          </article>
        </div>

        <article hub-panel>
          <p hub-panel-title>Mix review workflow</p>
          <p hub-panel-sub style={{ marginBottom: "16px" }}>
            Mirrors KiwiStage studio ops intent: versioned mixes, timestamped notes, and explicit approval checkpoints.
          </p>
          <div hub-metric-grid>
            <div hub-metric-card>
              <div stack gap="0.15rem" style={{ flex: 1 }}>
                <span hub-brand-sub style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: HUB_COLORS.sub }}>North End</span>
                <p hub-panel-title style={{ fontSize: "14px", margin: 0 }}>Mix v3 awaiting artist notes</p>
              </div>
              <HubBadge label="Review" color={HUB_COLORS.amber} />
            </div>
            <div hub-metric-card>
              <div stack gap="0.15rem" style={{ flex: 1 }}>
                <span hub-brand-sub style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: HUB_COLORS.sub }}>River Glass</span>
                <p hub-panel-title style={{ fontSize: "14px", margin: 0 }}>Stem package ready for download</p>
              </div>
              <HubBadge label="Ready" color={HUB_COLORS.emerald} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

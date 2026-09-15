import { Signal } from "@citrusworx/sigjs";
import { Render } from "../../app/Render";
import { HUB_NAV, type HubScreen } from "../../data/hub";

export function HubSidebar(props: {
  screen: Signal<HubScreen>;
  onNavigate: (screen: HubScreen) => void;
  brandTitle?: string;
  brandSub?: string;
  userName?: string;
  userMeta?: string;
  userInitials?: string;
}) {
  return (
    <aside hub-sidebar>
      <div hub-sidebar-head>
        <div row gap="0.5rem" centered>
          <div hub-brand-mark>K</div>
          <div stack gap="0">
            <p hub-brand-title>{props.brandTitle ?? "Artist Hub"}</p>
            <p hub-brand-sub>{props.brandSub ?? "POWERED BY KIWISTAGE"}</p>
          </div>
        </div>
        <div hub-user-row>
          <div hub-user-avatar>{props.userInitials ?? "JC"}</div>
          <div stack gap="0">
            <p hub-brand-title style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
              {props.userName ?? "Jamie Cole"}
            </p>
            <p hub-brand-sub style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "none", letterSpacing: "normal" }}>
              {props.userMeta ?? "Country-Rock · Austin, TX"}
            </p>
          </div>
        </div>
      </div>

      <nav hub-nav>
        <Render>
          {() => {
            let lastSection: string | null = "__";
            const active = props.screen.get();

            return HUB_NAV.map((item) => {
              const showSection = item.section !== lastSection;
              lastSection = item.section;
              const isActive = active === item.id;

              return (
                <div key={item.id}>
                  {showSection && item.section ? <p hub-nav-section>{item.section}</p> : null}
                  <button
                    type="button"
                    hub-nav-btn
                    active={isActive ? true : undefined}
                    onClick={() => props.onNavigate(item.id)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            });
          }}
        </Render>
      </nav>

      <div hub-sidebar-foot>
        <div hub-readiness>
          <p hub-brand-title style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: "6px" }}>
            Management Readiness
          </p>
          <div hub-readiness-track>
            <div hub-readiness-bar />
          </div>
          <p hub-brand-sub style={{ fontSize: "9px", color: "var(--hub-amber)", textTransform: "none", letterSpacing: "normal" }}>
            34% — 6 gaps to close
          </p>
        </div>
      </div>
    </aside>
  );
}

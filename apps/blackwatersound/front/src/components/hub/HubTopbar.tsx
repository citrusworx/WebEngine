import type { HubScreen } from "../../data/hub";
import { HUB_TITLES } from "../../data/hub";

export function HubTopbar(props: { screen: HubScreen; quarter?: string }) {
  const meta = HUB_TITLES[props.screen];

  return (
    <header hub-topbar>
      <div stack gap="0">
        <p hub-topbar-title>{meta.title}</p>
        <p hub-topbar-sub>{meta.sub}</p>
      </div>
      <span hub-quarter-pill>{props.quarter ?? "Q2 2026"}</span>
    </header>
  );
}

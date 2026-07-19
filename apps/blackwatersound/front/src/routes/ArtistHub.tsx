import { Signal } from "@citrusworx/sigjs";
import { Render } from "../app/Render";
import { HubSidebar } from "../components/hub/HubSidebar";
import { HubTopbar } from "../components/hub/HubTopbar";
import { HubAudience } from "../components/hub/screens/HubAudience";
import { HubDashboard } from "../components/hub/screens/HubDashboard";
import { HubMgmtReport } from "../components/hub/screens/HubMgmtReport";
import { HubArtists } from "../components/hub/screens/HubArtists";
import { HubCampaigns } from "../components/hub/screens/HubCampaigns";
import { HubReports } from "../components/hub/screens/HubReports";
import { HubSegments } from "../components/hub/screens/HubSegments";
import type { HubScreen } from "../data/hub";

const hubScreen = Signal<HubScreen>("dashboard");

function renderHubScreen(screen: HubScreen) {
  switch (screen) {
    case "audience":
      return <HubAudience />;
    case "artists":
      return <HubArtists />;
    case "segments":
      return <HubSegments />;
    case "campaigns":
      return <HubCampaigns />;
    case "reports":
      return <HubReports onNavigate={(next) => hubScreen.set(next)} />;
    case "report-mgmt":
      return <HubMgmtReport />;
    case "dashboard":
    default:
      return <HubDashboard onNavigate={(next) => hubScreen.set(next)} />;
  }
}

export function ArtistHub() {
  return (
    <div hub-shell>
      <HubSidebar
        screen={hubScreen}
        onNavigate={(screen) => hubScreen.set(screen)}
      />
      <div hub-main>
        <Render>{() => <HubTopbar screen={hubScreen.get()} />}</Render>
        <main>
          <Render>{() => renderHubScreen(hubScreen.get())}</Render>
        </main>
      </div>
    </div>
  );
}

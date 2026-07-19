import { HUB_REPORTS, type HubScreen } from "../../../data/hub";
import { HubBadge } from "../HubBadge";

export function HubReports(props: { onNavigate: (screen: HubScreen) => void }) {
  return (
    <div hub-content>
      <p hub-panel-title style={{ marginBottom: "4px" }}>Leverage Reports</p>
      <p hub-panel-sub>Turn your data into professional proof — for managers, venues, and sponsors</p>

      <div hub-reports-grid>
        {HUB_REPORTS.map((report) => (
          <article
            key={report.name}
            hub-report-card
            style={{ borderLeftColor: report.color }}
            data-clickable={report.id ? true : undefined}
            onClick={() => {
              if (report.id) {
                props.onNavigate(report.id);
              }
            }}
          >
            <div row space="between" gap="1rem" style={{ marginBottom: "12px" }}>
              <p hub-panel-title style={{ fontSize: "14px", margin: 0 }}>{report.name}</p>
              <div style={{ textAlign: "right" }}>
                <p hub-report-score style={{ fontSize: "18px", color: report.color, margin: 0 }}>{report.score}%</p>
                <HubBadge label={report.status} color={report.color} />
              </div>
            </div>
            <p hub-panel-sub style={{ marginBottom: "12px", lineHeight: 1.6 }}>{report.desc}</p>
            <div hub-report-progress>
              <div hub-report-progress-fill style={{ width: `${report.score}%`, backgroundColor: report.color }} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import { PortalShell } from "../../layouts/PortalShell";

const campaigns = [
  { name: "StinkRat launch", reach: "12.4k", status: "Live" },
  { name: "Fuzz Fundamentals", reach: "8.1k", status: "Draft" },
  { name: "Studio open house", reach: "—", status: "Planned" }
] as const;

export function LabelPortal() {
  return (
    <PortalShell
      tone="bw-lime"
      kicker="Label portal"
      title="Roster projects, release assets, and approvals"
      body="Shell for roster metadata, campaign reporting, and release workflows—HubCampaigns / HubReports reference."
    >
      <section shell stack gap="1rem">
        <article surface="bw-stage" stack gap="0.75rem">
          <p kicker="light">Roster snapshot</p>
          <p copy="inverse sm">3 active releases · 2 campaigns in flight · 1 metadata package awaiting approval.</p>
        </article>

        <article panel surface="bw-panel" stack gap="0.75rem">
          <p section-title>Campaigns</p>
          <div stack gap="0.5rem">
            {campaigns.map((campaign) => (
              <div key={campaign.name} spec-row row space="between" gap="1rem">
                <span spec-value>{campaign.name}</span>
                <span spec-label>{campaign.reach} · {campaign.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </PortalShell>
  );
}

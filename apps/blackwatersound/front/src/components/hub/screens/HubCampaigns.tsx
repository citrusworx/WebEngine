import { Signal } from "@citrusworx/sigjs";
import { Render } from "../../../app/Render";
import { HubBadge } from "../HubBadge";
import { HubBtn } from "../HubBtn";
import {
  CAMPAIGN_ASSETS,
  CAMPAIGN_GUIDANCE,
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_TYPES,
  FAN_SEGMENTS,
  HUB_COLORS,
} from "../../../data/hub";

const campaignStep = Signal(0);
const campaignType = Signal<string>(CAMPAIGN_TYPES[0]);
const campaignSegment = Signal("Superfans");
const campaignPlatform = Signal<string>(CAMPAIGN_PLATFORMS[0]);

const STEPS = ["Goal", "Audience", "Platform & Budget", "Content", "Review"] as const;

export function HubCampaigns() {
  return (
    <div hub-content>
      <div hub-campaign-layout>
        <div>
          <p hub-panel-title style={{ marginBottom: "4px" }}>Campaign Builder</p>
          <p hub-panel-sub>Turn Audience Compass insights into a campaign ready to run</p>

          <Render>
            {() => (
              <div hub-stepper>
                {STEPS.map((step, index) => (
                  <div key={step} hub-step>
                    <button
                      type="button"
                      hub-step-dot
                      data-active={index <= campaignStep.get() ? true : undefined}
                      onClick={() => campaignStep.set(index)}
                    >
                      {index + 1}
                    </button>
                    {index < STEPS.length - 1 ? (
                      <div hub-step-line data-active={index < campaignStep.get() ? true : undefined} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Render>

          <Render>
            {() => {
              const step = campaignStep.get();
              const type = campaignType.get();
              const segment = campaignSegment.get();
              const platform = campaignPlatform.get();

              if (step === 0) {
                return (
                  <div hub-campaign-step>
                    <p hub-campaign-step-title>Campaign Type</p>
                    <div hub-pill-group>
                      {CAMPAIGN_TYPES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          hub-pill
                          data-active={type === item ? true : undefined}
                          onClick={() => campaignType.set(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <label hub-field-label htmlFor="campaign-name">Campaign Name</label>
                    <input id="campaign-name" hub-input defaultValue="Blackwater Bloom — Release Awareness" />
                    <HubBtn label="Next: Choose Audience →" variant="primary" onClick={() => campaignStep.set(1)} />
                  </div>
                );
              }

              if (step === 1) {
                return (
                  <div hub-campaign-step>
                    <p hub-campaign-step-title>Target Segment</p>
                    <div hub-pill-group>
                      {FAN_SEGMENTS.slice(0, 6).map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          hub-pill
                          data-active={segment === item.name ? true : undefined}
                          style={segment === item.name ? { backgroundColor: item.color } : undefined}
                          onClick={() => campaignSegment.set(item.name)}
                        >
                          {item.name} ({item.size})
                        </button>
                      ))}
                    </div>
                    <div hub-campaign-callout>
                      <p hub-field-label>Audience Compass Insight</p>
                      <p hub-field-value>
                        Target fans of similar country-rock/Americana artists in Gulf Coast and Nashville-adjacent markets. Best response from working adults 24–38.
                      </p>
                    </div>
                    <div row gap="0.75rem">
                      <HubBtn label="← Back" onClick={() => campaignStep.set(0)} />
                      <HubBtn label="Next: Platform & Budget →" variant="primary" onClick={() => campaignStep.set(2)} />
                    </div>
                  </div>
                );
              }

              if (step === 2) {
                return (
                  <div hub-campaign-step>
                    <p hub-campaign-step-title>Platform</p>
                    <div hub-pill-group>
                      {CAMPAIGN_PLATFORMS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          hub-pill
                          data-active={platform === item ? true : undefined}
                          onClick={() => campaignPlatform.set(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div hub-two-col style={{ marginBottom: "20px" }}>
                      {(
                        [
                          ["Budget", "$300"],
                          ["Duration", "14 days"],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <label hub-field-label>{label}</label>
                          <input hub-input defaultValue={value} />
                        </div>
                      ))}
                    </div>
                    <div row gap="0.75rem">
                      <HubBtn label="← Back" onClick={() => campaignStep.set(1)} />
                      <HubBtn label="Next: Content Assets →" variant="primary" onClick={() => campaignStep.set(3)} />
                    </div>
                  </div>
                );
              }

              if (step === 3) {
                return (
                  <div hub-campaign-step>
                    <p hub-campaign-step-title>Content Assets</p>
                    <p hub-panel-sub>Recommended for {type}</p>
                    <div hub-asset-list>
                      {CAMPAIGN_ASSETS.map((item) => (
                        <div key={item.asset} hub-asset-row>
                          <div hub-asset-check data-checked={item.check ? true : undefined}>
                            {item.check ? "✓" : null}
                          </div>
                          <p hub-field-value style={{ flex: 1, margin: 0 }}>{item.asset}</p>
                          <HubBadge label={item.status} color={item.check ? HUB_COLORS.emerald : HUB_COLORS.amber} />
                        </div>
                      ))}
                    </div>
                    <div row gap="0.75rem">
                      <HubBtn label="← Back" onClick={() => campaignStep.set(2)} />
                      <HubBtn label="Review Campaign →" variant="primary" onClick={() => campaignStep.set(4)} />
                    </div>
                  </div>
                );
              }

              return (
                <div hub-campaign-step>
                  <div hub-campaign-review>
                    <p hub-panel-title>Blackwater Bloom — Release Awareness</p>
                    {(
                      [
                        ["Type", type],
                        ["Target", segment],
                        ["Platform", platform],
                        ["Budget", "$300"],
                        ["Duration", "14 days"],
                        ["CTA", "Pre-save on Spotify"],
                        ["Follow-up", "Email signup for acoustic demo"],
                      ] as const
                    ).map(([key, value]) => (
                      <div key={key} hub-review-row>
                        <span hub-field-label>{key}</span>
                        <span hub-field-value>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div hub-campaign-estimate>
                    <p hub-field-value style={{ margin: 0, color: HUB_COLORS.violet }}>
                      <strong>Estimated reach:</strong> 8,000–14,000 impressions · <strong>Expected CPA:</strong> $0.22–$0.38 per pre-save.
                    </p>
                  </div>
                  <div row gap="0.75rem">
                    <HubBtn label="← Edit" onClick={() => campaignStep.set(3)} />
                    <HubBtn label="✓ Save Campaign" variant="primary" />
                  </div>
                </div>
              );
            }}
          </Render>
        </div>

        <aside hub-guidance-panel>
          <p hub-guidance-title>Guidance</p>
          {CAMPAIGN_GUIDANCE.map((tip) => (
            <div key={tip} hub-guidance-row>
              <span hub-guidance-icon>i</span>
              <p hub-guidance-copy>{tip}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

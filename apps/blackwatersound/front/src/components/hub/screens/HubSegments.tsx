import { Signal } from "@citrusworx/sigjs";
import { Render } from "../../../app/Render";
import { HubBadge } from "../HubBadge";
import { HubBtn } from "../HubBtn";
import { FAN_SEGMENTS } from "../../../data/hub";

const activeSegment = Signal<string | null>(null);

export function HubSegments() {
  return (
    <div hub-content>
      <div hub-split-layout>
        <div>
          <div row space="between" gap="1rem" style={{ marginBottom: "16px" }}>
            <p hub-panel-title style={{ margin: 0 }}>Fan Segments</p>
            <HubBtn label="+ New Segment" />
          </div>
          <Render>
            {() => {
              const selectedName = activeSegment.get();
              return (
                <div hub-segment-list>
                  {FAN_SEGMENTS.map((segment) => (
                    <button
                      key={segment.name}
                      type="button"
                      hub-segment-row
                      data-active={selectedName === segment.name ? true : undefined}
                      style={{
                        borderColor: selectedName === segment.name ? segment.color : undefined,
                        boxShadow: selectedName === segment.name ? `0 0 0 2px ${segment.color}22` : undefined,
                      }}
                      onClick={() => activeSegment.set(selectedName === segment.name ? null : segment.name)}
                    >
                      <span hub-segment-dot style={{ backgroundColor: segment.color }} />
                      <span hub-segment-name>{segment.name}</span>
                      <span hub-segment-size>{segment.size.toLocaleString()}</span>
                      <HubBadge label={segment.growth} color={segment.growth.startsWith("+") ? segment.color : undefined} />
                      <span hub-segment-source>{segment.source}</span>
                    </button>
                  ))}
                </div>
              );
            }}
          </Render>
        </div>

        <aside hub-segment-detail>
          <Render>
            {() => {
              const selected = FAN_SEGMENTS.find((segment) => segment.name === activeSegment.get());
              if (!selected) {
                return (
                  <div hub-segment-empty>
                    <p hub-panel-sub style={{ margin: 0 }}>Select a segment to see details and recommended actions.</p>
                  </div>
                );
              }

              return (
                <div hub-segment-detail-card>
                  <div hub-segment-detail-accent style={{ backgroundColor: selected.color }} />
                  <div hub-segment-detail-body>
                    <div row gap="0.5rem" style={{ marginBottom: "16px" }}>
                      <p hub-panel-title style={{ flex: 1, margin: 0 }}>{selected.name}</p>
                      <span hub-segment-size style={{ color: selected.color, fontSize: "18px" }}>{selected.size}</span>
                    </div>
                    {(
                      [
                        ["Source", selected.source],
                        ["Growth", selected.growth],
                        ["Best CTA", selected.bestCTA],
                        ["Campaign", selected.campaign],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} hub-detail-field>
                        <p hub-field-label>{label}</p>
                        <p hub-field-value>{value}</p>
                      </div>
                    ))}
                    <div hub-segment-detail-actions>
                      <HubBtn label="Build Campaign →" variant="primary" />
                    </div>
                  </div>
                </div>
              );
            }}
          </Render>
        </aside>
      </div>
    </div>
  );
}

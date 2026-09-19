import { YAML_CONTENT, YAML_VERSIONS } from "../catalog";
import { simulateAction, yamlHistoryOpen } from "../state";

export function YAMLViewer() {
    const showHistory = yamlHistoryOpen.get();

    return (
        <div section-block>
            <div section-kicker>
                <div>
                    Configuration YAML
                    <span>Complete application and infrastructure definition</span>
                </div>
                <div action-group>
                    <button
                        btn="outline"
                        type="button"
                        scale="sm"
                        selected={showHistory || undefined}
                        onclick={() => yamlHistoryOpen.set(!showHistory)}
                    >
                        <i icon="clock-rotate-left" lib="solid" iconSize="sm"></i>
                        History
                    </button>
                    <button btn="outline" type="button" scale="sm" onclick={() => {
                        void navigator.clipboard?.writeText(YAML_CONTENT);
                        simulateAction("Copied simulated YAML.");
                    }}>
                        <i icon="copy" lib="solid" iconSize="sm"></i>
                        Copy
                    </button>
                    <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("YAML download is simulated.")}>
                        <i icon="download" lib="solid" iconSize="sm"></i>
                        Download
                    </button>
                    <button type="button" scale="sm" onclick={() => simulateAction("Blueprint export is simulated.")}>
                        <i icon="share-nodes" lib="solid" iconSize="sm"></i>
                        Export as Blueprint
                    </button>
                </div>
            </div>

            {showHistory
                ? <div panel-card ref={(node: HTMLElement) => { node.scrollIntoView({ block: "nearest", behavior: "smooth" }); }}>
                    <h3>Configuration History</h3>
                    {YAML_VERSIONS.map(version => (
                        <div history-row>
                            <div chip-row>
                                <span mono>{version.version}</span>
                                {version.current ? <span chip tone="ok">Current</span> : null}
                                <span subtle>{version.date}</span>
                                <span subtle>by {version.author}</span>
                            </div>
                            {version.current
                                ? null
                                : <button btn="ghost" type="button" onclick={() => simulateAction(`Restore ${version.version} is simulated.`)}>
                                    Restore
                                </button>}
                        </div>
                    ))}
                </div>
                : null}

            <div yaml-block>
                <pre><code>{YAML_CONTENT}</code></pre>
            </div>
        </div>
    );
}

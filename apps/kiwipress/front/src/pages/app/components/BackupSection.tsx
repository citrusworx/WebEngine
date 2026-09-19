import { SNAPSHOTS } from "../catalog";
import { backupsEnabled, simulateAction } from "../state";

export function BackupSection() {
    const enabled = backupsEnabled.get();

    return (
        <div section-block>
            <h2 section-kicker>Backups</h2>
            <div panel-card>
                <div header-row>
                    <div row gap="cozy">
                        <div choice-icon>
                            <i icon="database" lib="solid" iconSize="sm"></i>
                        </div>
                        <div>
                            <div chip-row>
                                <h3>Automatic Backups</h3>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        onchange={(event: Event) => {
                                            backupsEnabled.set((event.target as HTMLInputElement).checked);
                                        }}
                                    />
                                    <span subtle>{enabled ? "On" : "Off"}</span>
                                </label>
                            </div>
                            <p subtle>Daily snapshots created at 2:00 AM UTC</p>
                            <div detail-grid>
                                <div detail>
                                    <span>Last Snapshot</span>
                                    <p>Feb 14, 2:07 AM</p>
                                </div>
                                <div detail>
                                    <span>Snapshot Size</span>
                                    <p>2.4 GB</p>
                                </div>
                                <div detail>
                                    <span>Retention</span>
                                    <p>7 days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div action-group>
                        <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("Created a simulated snapshot.")}>
                            <i icon="plus" lib="solid" iconSize="sm"></i>
                            Create Snapshot
                        </button>
                        <button type="button" scale="sm" onclick={() => simulateAction("Restore is simulated.")}>
                            <i icon="rotate-left" lib="solid" iconSize="sm"></i>
                            Restore
                        </button>
                    </div>
                </div>
                <div>
                    <h4 section-kicker>Recent Snapshots</h4>
                    <div snapshot-list>
                        {SNAPSHOTS.map(snapshot => (
                            <div snapshot-row>
                                <span>{snapshot.date}</span>
                                <span mono>{snapshot.size}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

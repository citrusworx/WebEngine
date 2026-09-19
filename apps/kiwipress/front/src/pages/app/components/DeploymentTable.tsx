import { DEPLOYMENTS } from "../catalog";
import { simulateAction } from "../state";

export function DeploymentTable() {
    return (
        <div section-block>
            <div section-kicker>
                Deployments
                <button type="button" scale="sm" onclick={() => simulateAction("Queued a simulated deploy.")}>
                    <i icon="plus" lib="solid" iconSize="sm"></i>
                    Deploy New Version
                </button>
            </div>
            <div data-table-wrap>
                <table data-table>
                    <thead>
                        <tr>
                            <th>Deployment ID</th>
                            <th>Timestamp</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th end>Logs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEPLOYMENTS.map(deployment => (
                            <tr>
                                <td><span mono>{deployment.id}</span></td>
                                <td>{deployment.date}</td>
                                <td>
                                    <span chip tone={deployment.status === "Success" ? "ok" : "error"}>
                                        {deployment.status}
                                    </span>
                                </td>
                                <td><span mono>{deployment.duration}</span></td>
                                <td end>
                                    <button
                                        btn="ghost"
                                        type="button"
                                        aria-label={`View logs for ${deployment.id}`}
                                        onclick={() => simulateAction(`Logs for ${deployment.id} are simulated.`)}
                                    >
                                        <i icon="file-lines" lib="solid" iconSize="sm"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

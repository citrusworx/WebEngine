import { DashboardLayout } from "../layout/DashboardLayout";
import { ACTIVITIES } from "../catalog";

export function Activity() {
    return (
        <DashboardLayout page="activity">
            <div dashboard-page>
                <header page-header>
                    <h1>Activity</h1>
                    <p lede>Recent events and system activity for your application.</p>
                </header>

                <div activity-list>
                    {ACTIVITIES.map(activity => (
                        <div activity-item>
                            <div choice-icon tone={activity.status === "info" ? "info" : activity.status === "success" ? undefined : "quiet"}>
                                <i icon={activity.icon} lib="solid" iconSize="sm"></i>
                            </div>
                            <div activity-body>
                                <p>{activity.message}</p>
                                <p subtle>{activity.time}</p>
                            </div>
                            <span chip tone={activity.status === "success" ? "ok" : activity.status}>
                                {activity.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

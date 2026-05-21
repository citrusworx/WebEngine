import { DashboardLayout } from "../layout/DashboardLayout";

export function Activity() {
    return (
        <DashboardLayout page="activity">
            <header page-header>
                <h1>Activity</h1>
                <p lede>Deploys, configuration changes, and team actions across your projects.</p>
            </header>

            <div placeholder>
                <p>Audit log timeline, filter chips by project / actor / event type, and a live tail switch go here.</p>
            </div>
        </DashboardLayout>
    );
}

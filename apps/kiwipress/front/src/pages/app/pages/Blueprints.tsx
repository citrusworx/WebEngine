import { DashboardLayout } from "../layout/DashboardLayout";

export function Blueprints() {
    return (
        <DashboardLayout page="blueprints">
            <header page-header>
                <h1>Blueprints</h1>
                <p lede>Reusable stack templates you can spin into a new project.</p>
            </header>

            <div placeholder>
                <p>Blueprint catalog, version pinning, and apply-to-project flow go here.</p>
            </div>
        </DashboardLayout>
    );
}

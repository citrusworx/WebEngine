import { DashboardLayout } from "../layout/DashboardLayout";

export function Settings() {
    return (
        <DashboardLayout page="settings">
            <header page-header>
                <h1>Settings</h1>
                <p lede>Organization defaults, integrations, and security.</p>
            </header>

            <div placeholder>
                <p>Org profile, members, API keys, SSO, and audit retention land here.</p>
            </div>
        </DashboardLayout>
    );
}

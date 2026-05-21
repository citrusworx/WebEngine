import { DashboardLayout } from "../layout/DashboardLayout";

export function Projects() {
    return (
        <DashboardLayout page="projects">
            <header page-header>
                <h1>Projects</h1>
                <p lede>Your deployed KiwiPress instances and their health.</p>
            </header>

            <div placeholder>
                <p>Project grid, deployment status, environment metrics, and quick actions land here next.</p>
            </div>
        </DashboardLayout>
    );
}

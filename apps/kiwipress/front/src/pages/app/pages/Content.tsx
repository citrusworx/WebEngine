import { DashboardLayout } from "../layout/DashboardLayout";
import { ContentManager } from "../../../components/content-manager";
import { TransferPanel } from "./TransferPanel";

export function Content() {
    return (
        <DashboardLayout page="content">
            <header page-header>
                <h1>Content</h1>
                <p lede>
                    WordPress is the entry point. Transfer when you are ready for the Nectarine CMS WebEngine runs.
                </p>
            </header>

            <div stack gap="2rem">
                <TransferPanel />
                <ContentManager />
            </div>
        </DashboardLayout>
    );
}

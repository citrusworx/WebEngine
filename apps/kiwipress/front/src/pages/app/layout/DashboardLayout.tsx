import { Sidebar } from "./Sidebar";
import { ActionNotice } from "../components/ActionNotice";
import "../dashboard.css";

type LayoutOpts = {
    page: string;
    children?: unknown;
};

export function DashboardLayout({ page, children }: LayoutOpts) {
    return (
        <div dashboard-shell theme="kiwipress">
            <Sidebar active={page} />
            <main dashboard-main>
                <ActionNotice />
                {children}
            </main>
        </div>
    );
}

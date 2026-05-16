import { Sidebar, type NavId } from "./Sidebar";

type LayoutOpts = {
    page: NavId;
    children?: unknown;
};

export function DashboardLayout({ page, children }: LayoutOpts) {
    return (
        <div dashboard-shell theme="kiwipress">
            <Sidebar active={page} />
            <main dashboard-main>
                {children}
            </main>
        </div>
    );
}

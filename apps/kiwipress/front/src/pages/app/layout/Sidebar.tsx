export type NavId = "projects" | "blueprints" | "billing" | "activity" | "settings" | "account";

type NavItem = {
    id: NavId;
    path: string;
    label: string;
    icon: string;
};

const PRIMARY_NAV: NavItem[] = [
    { id: "projects",   path: "/app/projects",   label: "Projects",   icon: "table-cells" },
    { id: "blueprints", path: "/app/blueprints", label: "Blueprints", icon: "layer-group" }
];

const SECONDARY_NAV: NavItem[] = [
    { id: "billing",  path: "/app/billing",  label: "Billing",  icon: "credit-card" },
    { id: "activity", path: "/app/activity", label: "Activity", icon: "wave-square" },
    { id: "settings", path: "/app/settings", label: "Settings", icon: "gear" },
    { id: "account",  path: "/app/account",  label: "Account",  icon: "user" }
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <li>
            <a href={item.path} nav-link={active ? "active" : "idle"}>
                <i icon={item.icon} lib="solid" iconSize="sm"></i>
                <span>{item.label}</span>
            </a>
        </li>
    );
}

export function Sidebar({ active }: { active: NavId }) {
    return (
        <aside dashboard-sidebar>
            <div sidebar-brand>
                <span logo>KiwiPress</span>
                <span logo-suffix>Cloud</span>
            </div>

            <nav sidebar-nav>
                <ul nav-group>
                    {PRIMARY_NAV.map(item => (
                        <NavLink item={item} active={item.id === active} />
                    ))}
                </ul>

                <hr nav-divider />

                <ul nav-group>
                    {SECONDARY_NAV.map(item => (
                        <NavLink item={item} active={item.id === active} />
                    ))}
                </ul>
            </nav>

            <div sidebar-footer>
                <p version>v0.0.1</p>
                <a href="#" doc-link>Documentation</a>
            </div>
        </aside>
    );
}

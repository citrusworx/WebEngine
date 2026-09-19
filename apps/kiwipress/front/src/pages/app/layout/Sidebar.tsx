import { effect } from "@citrusworx/sigjs";
import { refreshRegisteredTypes, registeredTypes } from "../types/state";
import { typeItemPath } from "../types/model";

export type NavId =
    | "projects"
    | "posts"
    | "pages"
    | "content"
    | "types"
    | "blueprints"
    | "billing"
    | "activity"
    | "settings"
    | "account"
    | (string & {});

type NavItem = {
    id: string;
    path: string;
    label: string;
    icon: string;
};

const PRIMARY_NAV: NavItem[] = [
    { id: "projects",   path: "/app/projects",   label: "Projects",   icon: "table-cells" },
    { id: "posts",      path: "/app/posts",      label: "Posts",      icon: "pen" },
    { id: "pages",      path: "/app/pages",      label: "Pages",      icon: "file" },
    { id: "content",    path: "/app/content",    label: "Content",    icon: "right-left" },
    { id: "types",      path: "/app/types",      label: "Types",      icon: "cubes" },
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

function isActive(item: NavItem, active: string): boolean {
    return item.id === active || item.path === `/app/c/${active.replace(/^c:/, "")}`;
}

export function Sidebar({ active }: { active: string }) {
    let typeNavNode: HTMLElement | null = null;
    let requested = false;

    function paintTypes() {
        if (!typeNavNode) {
            return;
        }

        const items = registeredTypes.get();
        if (items.length === 0) {
            typeNavNode.replaceChildren();
            return;
        }

        typeNavNode.replaceChildren(
            <ul nav-group>
                {items.map((definition) => {
                    const item = {
                        id: `c:${definition.slug}`,
                        path: typeItemPath(definition.slug),
                        label: definition.label,
                        icon: "box"
                    };
                    return <NavLink item={item} active={isActive(item, active)} />;
                })}
            </ul> as Node
        );
    }

    effect(() => {
        registeredTypes.get();
        paintTypes();
    });

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

                <div
                    ref={(node: HTMLElement) => {
                        typeNavNode = node;
                        paintTypes();
                        if (!requested) {
                            requested = true;
                            void refreshRegisteredTypes().catch(() => {
                                registeredTypes.set([]);
                            });
                        }
                    }}
                />

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

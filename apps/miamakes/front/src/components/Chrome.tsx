import { currentPath } from "../router";
import { Render } from "../render";

const tabs = [
  { href: "/", label: "Home", icon: "house", lib: "solid" },
  { href: "/profile", label: "Profile", icon: "circle-user", lib: "regular" },
  { href: "/mail", label: "Mail", icon: "envelope", lib: "regular" },
  { href: "/settings", label: "Settings", icon: "gear", lib: "solid" },
] as const;

function tabCurrent(path: string, href: string): "page" | undefined {
  if (href === "/") {
    return path === "/" ? "page" : undefined;
  }
  return path === href || path.startsWith(`${href}/`) ? "page" : undefined;
}

export function Chrome() {
  return (
    <div theme="miamakes" class="mm-app">
      <header surface="mm-topbar" class="mm-topbar"></header>
      <div surface="mm-welcome" class="mm-welcome">
        <Render>
          {() =>
            currentPath.get() === "/" ? (
              <p font="poppins" fontColor="white-100">
                Welcome, User
              </p>
            ) : null
          }
        </Render>
      </div>
      <div id="page-content" class="mm-page"></div>
      <Render>
        {() => {
          const path = currentPath.get();
          return (
            <nav surface="mm-tabbar" class="mm-tabbar" aria-label="Primary">
              {tabs.map((tab) => (
                <a href={tab.href} aria-label={tab.label} aria-current={tabCurrent(path, tab.href)}>
                  <i icon={tab.icon} lib={tab.lib} iconSize="md" iconcolor="white-100"></i>
                </a>
              ))}
            </nav>
          );
        }}
      </Render>
    </div>
  );
}

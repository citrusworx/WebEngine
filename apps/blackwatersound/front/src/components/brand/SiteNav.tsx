import { currentPath } from "../../app/router";
import { Render } from "../../app/Render";
import { Logo } from "./Logo";
import { PRIMARY_NAV } from "./brand";

export function SiteNav() {
  return (
    <header site-nav="bw-orange">
      <Render>
        {() => {
          const path = currentPath.get();

          return (
            <div shell nav-inner gap="1rem">
              <a href="/" nav-brand>
                <Logo compact />
              </a>
              <nav nav-links row gap="0.5rem">
                {PRIMARY_NAV.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    nav-link
                    active={path === link.href ? true : undefined}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div nav-actions row gap="0.75rem">
                <a href="/#signup" nav-cta>
                  Sign Up
                </a>
              </div>
            </div>
          );
        }}
      </Render>
    </header>
  );
}

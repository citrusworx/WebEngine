import { ColorBar } from "./ColorBar";
import { Logo } from "./Logo";
import { FOOTER_NAV } from "./brand";

export function PageFooter() {
  return (
    <div site-footer-wrap>
      <ColorBar />
      <footer site-footer>
        <div shell site-footer-inner>
          <div site-footer-top>
            <a href="/" site-footer-brand>
              <Logo compact />
            </a>
            <div site-footer-nav role="navigation" aria-label="Footer">
              {FOOTER_NAV.map((link) => (
                <a key={link.href} href={link.href} site-footer-link>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div site-footer-bottom>
            <p site-footer-copy>
              Boutique gear, studio-minded lessons, and publishing for people who care how a signal chain actually feels in the room.
            </p>
            <p site-footer-legal>© 2026 Blackwater Sound. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

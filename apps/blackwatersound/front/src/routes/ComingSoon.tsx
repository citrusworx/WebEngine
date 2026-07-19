import { PageFooter } from "../components/brand/PageFooter";
import { ColorBar } from "../components/brand/ColorBar";
import { WaitlistForm } from "../components/forms/WaitlistForm";
import { GUITAR_IMG, STUDIO_IMG } from "../components/brand/brand";
import { joinWaitlist } from "../services/waitlist";

const sellingPoints = [
  {
    title: "Boutique tone",
    body: "Hand-wired fuzz, utility pedals, amps, and studio pieces shaped in a visual system that now matches the Kiwi stack."
  },
  {
    title: "Kiwi-native frontend",
    body: "This starter now leans on Juice attributes and Sig.js signals instead of Tailwind classes and inline style declarations."
  },
  {
    title: "Ready for Sugar",
    body: "Sections are cleaner, more modular, and easier to bridge into future KiwiPress, Nectarine, and Sugar flows."
  }
];

export function ComingSoon() {
  return (
    <div stack>
      <section hero-section>
        <div shell hero-grid grid>
          <div hero-copy stack gap="1.25rem">
            <p kicker>Blackwater Sound x Kiwi starter</p>
            <h1 display>Built for tone. Rebuilt for Kiwi.</h1>
            <p copy="lead">
              The original mockup looked the part, but it was still shipping React, Tailwind, and scattered inline styling. This pass moves the starter toward the real CitrusWorx frontend stack.
            </p>
            <WaitlistForm
              onSubmit={joinWaitlist}
              successBody="Next step is wiring this into Nectarine instead of leaving it as placeholder UI."
            />
          </div>

          <div hero-media stack gap="1rem">
            <div media-frame="square">
              <img src={GUITAR_IMG} alt="Blackwater Sound guitar hero" media-image />
            </div>
            <div card card-tone="dark" stack gap="0.75rem">
              <p kicker>Frontend notes</p>
              <p copy="sm inverse">
                Juice handles the macro composition, while tiny app-owned CSS classes cover brand polish that should not live inside the design system itself.
              </p>
              <ColorBar />
            </div>
          </div>
        </div>
      </section>

      <section band>
        <div shell band-grid grid>
          {sellingPoints.map((item) => (
            <article key={item.title} card stack gap="0.75rem">
              <p section-title>{item.title}</p>
              <p copy="sm">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section shell story-layout grid>
        <div stack gap="1rem">
          <p kicker>Next slice</p>
          <h2 heading>Studio, lessons, store, and publishing can now share one frontend language.</h2>
          <p copy>
            The mockup still uses placeholder imagery and copy, but its structure is now much closer to how a real Kiwi Engine site should feel: declarative, reusable, and easier to extend without a thicket of one-off style objects.
          </p>
          <div row gap="0.75rem">
            <a href="/products" button-tone="ink">Browse the Store</a>
            <a href="/portal/studio" button-tone="ghost">Visit the Studio</a>
            <a href="/lesson" button-tone="ghost">Open a Lesson</a>
          </div>
        </div>
        <div media-frame="wide">
          <img src={STUDIO_IMG} alt="Studio space" media-image />
        </div>
      </section>

      <PageFooter />
    </div>
  );
}

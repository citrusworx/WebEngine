import { PageFooter } from "../components/brand/PageFooter";
import { ColorBar } from "../components/brand/ColorBar";
import { WaitlistForm } from "../components/forms/WaitlistForm";
import { GUITAR_IMG, STUDIO_IMG } from "../components/brand/brand";
import { joinWaitlist } from "../services/waitlist";

const sellingPoints = [
  {
    title: "Boutique gear",
    body: "Hand-wired fuzz, utility pedals, amps, and studio pieces selected for artists who care how the room sounds — not just how the rack looks."
  },
  {
    title: "Studio & lessons",
    body: "Book tracking time, mix reviews, and one-to-one lessons with coaches who still work on tape when the song asks for it."
  },
  {
    title: "Publishing & releases",
    body: "A small label desk for roster projects, release assets, and metadata — so songs leave the building with a plan."
  }
];

export function ComingSoon() {
  return (
    <div stack>
      <section hero-section>
        <div shell hero-grid grid>
          <div hero-copy stack gap="1.25rem">
            <p kicker>Blackwater Sound</p>
            <h1 display>Loud boutique audio. Quiet enough to hear the take.</h1>
            <p copy="lead">
              Retail, studio, lessons, and publishing under one roof — for artists, engineers, and labels who want gear that earns its keep and rooms that tell the truth.
            </p>
            <WaitlistForm
              onSubmit={joinWaitlist}
              successBody="You're on the list. We'll write when the next drop, session block, or course opens."
            />
          </div>

          <div hero-media stack gap="1rem">
            <div media-frame="square">
              <img src={GUITAR_IMG} alt="Blackwater Sound guitar hero" media-image />
            </div>
            <div card card-tone="dark" stack gap="0.75rem">
              <p kicker>What we're opening</p>
              <p copy="sm inverse">
                Studio booking, lesson seats, and a curated storefront — with an artist hub for mixes, sessions, and release work.
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
          <p kicker>Four doors, one shop</p>
          <h2 heading>Studio, lessons, store, and publishing — pick a door and walk in.</h2>
          <p copy>
            Blackwater Sound is a boutique audio house: track and mix in the studio, learn with working coaches, shop pedals and instruments that made the cut, and publish when the song is ready.
          </p>
          <div row gap="0.75rem">
            <a href="/products" button-tone="ink">Browse the Store</a>
            <a href="/portal/studio" button-tone="ghost">Visit the Studio</a>
            <a href="/lesson" button-tone="ghost">Open a Lesson</a>
            <a href="/blog" button-tone="ghost">Publishing</a>
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

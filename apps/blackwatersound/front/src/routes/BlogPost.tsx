import { Signal } from "@citrusworx/sigjs";
import { Render } from "../app/Render";
import { PageFooter } from "../components/brand/PageFooter";
import { GUITAR_IMG, STUDIO_IMG } from "../components/brand/brand";
import { GERMANIUM_BLOG } from "../data/germanium-blog";

const playing = Signal(false);

export function BlogPost() {
  return (
    <div ks-page>
      <header ks-blog-hero>
        <img src={STUDIO_IMG} alt="Musicians recording" ks-blog-hero-img />
        <div ks-blog-hero-overlay />
        <div ks-shell="article" ks-blog-hero-content>
          <div ks-blog-hero-meta>
            <span ks-blog-kicker>{GERMANIUM_BLOG.category}</span>
            <span ks-blog-date>
              {GERMANIUM_BLOG.date} · {GERMANIUM_BLOG.readTime}
            </span>
          </div>
          <h1 ks-blog-title>
            {GERMANIUM_BLOG.titleLine1}
            <br />
            {GERMANIUM_BLOG.titleLine2}
          </h1>
        </div>
      </header>

      <article ks-shell="article" ks-blog-body>
        <div ks-blog-author>
          <div ks-blog-avatar>
            <span>{GERMANIUM_BLOG.author.initials}</span>
          </div>
          <div>
            <p ks-blog-author-name>{GERMANIUM_BLOG.author.name}</p>
            <p ks-blog-author-role>{GERMANIUM_BLOG.author.role}</p>
          </div>
        </div>

        <p ks-blog-lead>{GERMANIUM_BLOG.lead}</p>

        <div ks-blog-video>
          <Render>
            {() =>
              playing.get() ? (
                <iframe
                  src={GERMANIUM_BLOG.videoUrl}
                  title="Fuzz Demo"
                  ks-blog-iframe
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div ks-blog-video-idle>
                  <img src={GUITAR_IMG} alt="Guitar demo thumbnail" ks-blog-video-thumb />
                  <div ks-blog-video-controls>
                    <button
                      type="button"
                      ks-blog-play-btn
                      aria-label="Play demo"
                      onClick={() => playing.set(true)}
                    >
                      <span ks-blog-play-icon aria-hidden="true" />
                    </button>
                    <p ks-blog-video-label>{GERMANIUM_BLOG.videoLabel}</p>
                  </div>
                </div>
              )
            }
          </Render>
          <div ks-blog-video-bar>
            <span />
            <span />
            <span />
          </div>
        </div>

        {GERMANIUM_BLOG.sections.map((section) => (
          <section key={section.heading} ks-blog-section>
            <h2 ks-blog-section-title>{section.heading}</h2>
            <p ks-blog-section-copy>{section.body}</p>
          </section>
        ))}

        <blockquote ks-blog-quote>
          <p ks-blog-quote-text>"{GERMANIUM_BLOG.quote.text}"</p>
          <span ks-blog-quote-credit>— {GERMANIUM_BLOG.quote.credit}</span>
        </blockquote>
      </article>

      <PageFooter />
    </div>
  );
}
